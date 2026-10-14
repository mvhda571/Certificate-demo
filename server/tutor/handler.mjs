import { findRelevantNotes } from './knowledge.mjs';
import {
  IELTS_SPEAKING_PROMPT,
  IMAGE_ONLY_QUESTION,
  TUTOR_SYSTEM_PROMPT,
  WEB_SEARCH_ON,
  WEB_SEARCH_UNAVAILABLE,
  WEB_SEARCH_WITH_IMAGES,
} from './prompt.mjs';
import { createRateLimiter, getClientIp, groqBaseUrl, jsonResponse, retryAfterSeconds } from './http.mjs';
import { identifyStudent } from './identity.mjs';
import { createMistakeFilter } from './mistakeFilter.mjs';
import { getQuota, reserveQuestion } from './quota.mjs';

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const NOTES_CHAR_BUDGET = 6000;
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const envNumber = (name, fallback) => {
  const value = Number.parseFloat(process.env[name]);
  return Number.isFinite(value) && value >= 0 && value <= 2 ? value : fallback;
};
const temperatureWithNotes = () => envNumber('TUTOR_TEMPERATURE_NOTES', 0.3);
const temperatureDefault = () => envNumber('TUTOR_TEMPERATURE', 0.5);
const DEFAULT_VISION_MODEL = 'qwen/qwen3.8-27b';
// Rasmlar brauzerda ~1600px JPEG'ga siqiladi; Vercel funksiyasi tanasi 4.5 MB bilan cheklangan.
const MAX_IMAGES = 3;
const MAX_IMAGE_CHARS = 1_600_000;
const MAX_BODY_BYTES = 4_400_000;
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const UI_LANGUAGES = { uz: 'Uzbek (Latin script)', ru: 'Russian', en: 'English' };
const overRateLimit = createRateLimiter({ windowMs: 10 * 60 * 1000, limit: 20 });

function validateImages(images) {
  if (images === undefined) return [];
  if (!Array.isArray(images) || images.length > MAX_IMAGES) return null;
  if (images.some((image) => typeof image !== 'string' || image.length > MAX_IMAGE_CHARS || !IMAGE_DATA_URL.test(image))) return null;
  return images;
}

// Rasmlar faqat oxirgi foydalanuvchi xabarida bo'lishi mumkin (eski rasmlar saqlanmaydi).
function validateMessages(value) {
  if (!Array.isArray(value) || value.length === 0) return null;
  const messages = value.slice(-MAX_MESSAGES);
  const last = messages.at(-1);
  if (last?.role !== 'user') return null;
  const images = validateImages(last.images);
  if (!images) return null;
  if (messages.some((message) => (
    !message
    || !['user', 'assistant'].includes(message.role)
    || typeof message.content !== 'string'
    || message.content.length > MAX_MESSAGE_LENGTH
    || (!message.content.trim() && !(message === last && images.length))
  ))) return null;
  return {
    messages: messages.map(({ role, content }) => ({ role, content })),
    images,
  };
}

// "Imlo", "Eslab qolish", "xato" bo'limlari — "Ko'p uchraydigan xato" qismi shulardan tuziladi.
const MISTAKE_SECTION = /^##\s+.*(imlo|eslab qolish|xato).*$/im;
function mistakeSections(content) {
  return content
    .split(/(?=^##\s+)/m)
    .filter((section) => MISTAKE_SECTION.test(section.split('\n')[0]))
    .map((section) => section.trim());
}

// Konspektlar to'liq beriladi, lekin umumiy hajm NOTES_CHAR_BUDGET dan oshmaydi.
function buildNotesContext(notes) {
  let remaining = NOTES_CHAR_BUDGET;
  const used = [];
  const parts = [];
  for (const note of notes) {
    if (remaining < 400) break;
    const header = `[${used.length + 1}] ${note.title} | ${note.fan || 'Fan koʼrsatilmagan'} | ${note.sinf ? `${note.sinf}-sinf` : 'Sinf koʼrsatilmagan'}`;
    const body = note.content.length > remaining ? `${note.content.slice(0, remaining)}\n…` : note.content;
    remaining -= body.length;
    used.push(note);
    parts.push(`${header}\n${body}`);
  }
  const spelling = used.flatMap((note) => mistakeSections(note.content)).join('\n\n').slice(0, 1500);
  return {
    used,
    text: used.length
      ? [
        `PLATFORM NOTES (konspekt) for the student's next question. Base the answer only on these notes.\n\n${parts.join('\n\n---\n\n')}`,
        ...(spelling ? [`SPELLING / MEMORY SECTIONS from the notes — use them for "Ko'p uchraydigan xato" and copy every form exactly:\n\n${spelling}`] : []),
      ].join('\n\n=====\n\n')
      : '',
  };
}

const supportsBrowserSearch = (model) => /^openai\/gpt-oss-(120b|20b)$/.test(model);
const isCompound = (model) => model.startsWith('groq/compound');

// Internet so'ralganda modellarni navbat bilan sinaymiz; oxirgi variant — internetsiz javob.
function planAttempts(webSearch, hasImages) {
  const baseModel = process.env.GROQ_MODEL || DEFAULT_MODEL;
  // Rasmli savol faqat vision modelga ketadi (unda browser_search yo'q).
  if (hasImages) {
    return [{ model: process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL, search: webSearch ? 'unavailable' : 'off', vision: true }];
  }
  if (!webSearch) return [{ model: baseModel, search: 'off' }];

  const searchModel = process.env.GROQ_SEARCH_MODEL || DEFAULT_MODEL;
  const attempts = [];
  if (isCompound(searchModel)) attempts.push({ model: searchModel, search: 'compound' });
  else if (supportsBrowserSearch(searchModel)) attempts.push({ model: searchModel, search: 'browser' });
  if (supportsBrowserSearch(baseModel) && !attempts.some((item) => item.model === baseModel)) {
    attempts.push({ model: baseModel, search: 'browser' });
  }
  attempts.push({ model: baseModel, search: 'unavailable' });
  return attempts;
}

function stripLinePrefixes(output) {
  return output.split('\n').map((line) => line.replace(/^L\d+:\s?/, '')).join('\n');
}

function safeUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

// browser.search / browser.open natijalaridan "cursor" (【N†…】 dagi N) → sahifa jadvalini tuzadi.
function createToolTracker() {
  const seen = new Set();
  const cursors = [];
  const searchResults = new Map();
  const log = [];

  function addSearchResults(results) {
    for (const result of results || []) {
      const url = safeUrl(result?.url);
      const title = typeof result?.title === 'string' ? result.title.trim().slice(0, 300) : '';
      if (url && title && !searchResults.has(url)) searchResults.set(url, { title, url });
    }
  }

  function handle(tool) {
    if (!tool || typeof tool !== 'object') return;
    addSearchResults(tool.search_results?.results);
    if (typeof tool.output !== 'string') return;
    const key = `${tool.index}:${tool.name}`;
    if (seen.has(key)) return;
    seen.add(key);

    let args = {};
    try { args = JSON.parse(tool.arguments || '{}'); } catch { /* ignore */ }
    log.push(`${tool.name || tool.type}(${args.query || args.pattern || (args.id !== undefined ? `id=${args.id}` : '')})`);

    const text = stripLinePrefixes(tool.output);
    const url = safeUrl(text.match(/URL:\s*(https?:\/\/\S+)/)?.[1] || '');
    if (!url) return;
    if (tool.name === 'browser.search') {
      cursors.push({ kind: 'search', url });
      return;
    }
    const afterUrl = text.slice(text.indexOf(url) + url.length).split('\n').map((line) => line.trim()).find(Boolean) || '';
    const title = searchResults.get(url)?.title || afterUrl.replace(/\s*\\?\|\s*$/, '').slice(0, 200) || new URL(url).hostname;
    cursors.push({ kind: 'page', url, title });
  }

  return {
    handle,
    log,
    get executed() { return log.length > 0; },
    sources() {
      const pages = cursors
        .map((item, cursor) => (item.kind === 'page' ? { title: item.title, url: item.url, cursor } : null))
        .filter(Boolean)
        .filter((item, index, list) => list.findIndex((other) => other.url === item.url) === index);
      if (pages.length) return pages;
      return [...searchResults.values()].slice(0, 5);
    },
  };
}

// Internet qidiruvi shu vaqt ichida javob matnini boshlamasa, qidiruvsiz javobga o'tamiz.
const searchTimeoutMs = () => Number(process.env.TUTOR_SEARCH_TIMEOUT_MS) || 7000;
// Butun javob uchun chegara (Netlify/Vercel funksiyasi 60 s'da uziladi — undan oldin o'zimiz yopamiz).
const maxDurationMs = () => Number(process.env.TUTOR_MAX_DURATION_MS) || 55000;

const NDJSON_HEADERS = {
  'Content-Type': 'application/x-ndjson; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

// Groq SSE oqimini o'qiydi va mijozga NDJSON hodisalari sifatida uzatadi.
// filter — konspekt bo'lsa, "❌ … → ✅ …" qatorlarini tekshiradi (mistakeFilter.mjs).
async function pumpAttempt({ upstream, send, tools, onFirstContent, filter }) {
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let buffer = '';
  let announcedSearch = false;
  let gotContent = false;

  const handleEvent = (event) => {
    const choice = event.choices?.[0];
    const delta = choice?.delta || choice?.message || {};
    if (typeof delta.content === 'string' && delta.content) {
      if (!gotContent) {
        gotContent = true;
        onFirstContent();
      }
      const text = filter ? filter.push(delta.content) : delta.content;
      if (text) send({ type: 'delta', text });
    }
    for (const tool of [delta.executed_tools, choice?.executed_tools, event.executed_tools].flat()) {
      if (!tool) continue;
      tools.handle(tool);
      if (!announcedSearch) {
        announcedSearch = true;
        send({ type: 'status', status: 'searching' });
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = done ? '' : lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        handleEvent(JSON.parse(data));
      } catch {
        // To'liq bo'lmagan SSE qatori — o'tkazib yuboramiz.
      }
    }
    if (done) break;
  }
  const rest = filter?.flush();
  if (rest) send({ type: 'delta', text: rest });
}

// Javob oqimi darhol boshlanadi (quota/sources hodisalari), Groq'ga urinishlar oqim ichida bajariladi.
function streamAnswer({ attempts, makeRequest, notes, reservation, requestSignal }) {
  const encoder = new TextEncoder();
  const noteMeta = notes.map(({ title, fan, sinf, heading, file }) => ({ title, fan, sinf, heading, file }));
  const startedAt = Date.now();
  const log = [];

  const body = new ReadableStream({
    async start(controller) {
      let closed = false;
      let contentSent = false;
      let searchTimedOut = false;
      const send = (event) => {
        if (!closed) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      const fail = async (message, code) => {
        if (!contentSent) await reservation.release();
        send({ type: 'error', message, ...(code ? { code } : {}) });
      };
      const deadline = new AbortController();
      const deadlineTimer = setTimeout(() => deadline.abort(), maxDurationMs());

      send({ type: 'quota', ...reservation.quota });
      send({ type: 'sources', web: [], notes: noteMeta, search: attempts[0].search === 'off' ? 'off' : 'pending' });

      try {
        for (const [index, attempt] of attempts.entries()) {
          if (searchTimedOut && attempt.search !== 'unavailable') continue;
          const searching = attempt.search === 'browser' || attempt.search === 'compound';
          const tools = createToolTracker();
          const attemptController = new AbortController();
          const abortAttempt = () => attemptController.abort();
          requestSignal.addEventListener('abort', abortAttempt);
          deadline.signal.addEventListener('abort', abortAttempt);
          let searchTimerFired = false;
          const searchTimer = searching
            ? setTimeout(() => { searchTimerFired = true; attemptController.abort(); }, searchTimeoutMs())
            : null;

          try {
            const upstream = await makeRequest(attempt, attemptController.signal);
            if (!upstream.ok || !upstream.body) {
              const details = (await upstream.text().catch(() => '')).slice(0, 300);
              log.push(`${attempt.model}/${attempt.search}:${upstream.status}`);
              console.warn(`[tutor] Groq request failed (${attempt.model}, search=${attempt.search}, ${upstream.status}): ${details}`);
              // Groq limiti (masalan, bepul tarifda 8000 token/daqiqa) — boshqa modelga o'tish ham shu limitga uriladi.
              if (upstream.status === 429) {
                await fail(`AI so‘rovlar limiti vaqtincha tugadi. ${retryAfterSeconds(details, upstream.headers)} soniyadan keyin qayta urinib ko‘ring.`, 'rate_limited');
                return;
              }
              if (attempt.vision) {
                const reason = upstream.status === 404 || upstream.status === 400
                  ? `${attempt.model} modeli rasmni qabul qilmadi (GROQ_VISION_MODEL sozlamasini tekshiring).`
                  : `${attempt.model} modeli hozir javob bermayapti.`;
                await fail(`Rasmni tahlil qilib bo‘lmadi: ${reason} Savolni matn bilan yozib ko‘ring.`, 'vision_failed');
                return;
              }
              continue;
            }

            const filter = notes.length ? createMistakeFilter(notes.map((note) => note.content).join('\n')) : null;
            await pumpAttempt({
              upstream,
              send,
              tools,
              filter,
              onFirstContent: () => {
                contentSent = true;
                clearTimeout(searchTimer);
              },
            });
            log.push(`${attempt.model}/${attempt.search}:ok`);
            if (filter?.dropped.length) console.warn(`[tutor] konspektga mos kelmagan xato qatorlari olib tashlandi: ${filter.dropped.join(' | ')}`);

            const search = attempt.search === 'off' ? 'off'
              : attempt.search === 'unavailable' ? (searchTimedOut ? 'timeout' : 'unavailable')
                : tools.executed ? 'ok' : 'unused';
            const web = tools.sources();
            console.info(`[tutor] model=${attempt.model} search=${search} fallback=${index > 0} tools=[${tools.log.join(', ')}] web=${web.length} notes=[${notes.map((note) => note.file).join(', ')}] attempts=[${log.join(' → ')}] ${Date.now() - startedAt}ms`);
            send({ type: 'sources', web, notes: noteMeta, search });
            send({ type: 'done', model: attempt.model, fallback: index > 0 });
            return;
          } catch (error) {
            // Qidiruv chegaradan oshdi va hali matn yuborilmagan — qidiruvsiz urinishga o'tamiz.
            if (searchTimerFired && !contentSent && !deadline.signal.aborted && !requestSignal.aborted) {
              searchTimedOut = true;
              log.push(`${attempt.model}/${attempt.search}:search-timeout(${searchTimeoutMs()}ms)`);
              console.warn(`[tutor] web search exceeded ${searchTimeoutMs()}ms — falling back to an answer without search`);
              send({ type: 'status', status: 'search-timeout' });
              continue;
            }
            throw error;
          } finally {
            clearTimeout(searchTimer);
            requestSignal.removeEventListener('abort', abortAttempt);
            deadline.signal.removeEventListener('abort', abortAttempt);
          }
        }
        console.error(`[tutor] all attempts failed: ${log.join(' → ')}`);
        await fail('AI javob bera olmadi. Birozdan so‘ng qayta urinib ko‘ring.');
      } catch (error) {
        if (deadline.signal.aborted) {
          console.warn(`[tutor] answer exceeded ${maxDurationMs()}ms: ${log.join(' → ')}`);
          await fail('Javob vaqt chegarasiga yetib uzildi. Qayta urinib ko‘ring.', 'timeout');
        } else if (requestSignal.aborted) {
          if (!contentSent) await reservation.release();
        } else {
          console.error('[tutor] stream failed:', error);
          await fail('AI xizmatiga ulanishda xatolik yuz berdi.');
        }
      } finally {
        clearTimeout(deadlineTimer);
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(body, { headers: NDJSON_HEADERS });
}

export async function handleTutorRequest(request) {
  // GET — bugungi qolgan savollar soni (hisobni o'zgartirmaydi).
  if (request.method === 'GET') {
    try {
      return jsonResponse(200, { quota: await getQuota(await identifyStudent(request)) });
    } catch (error) {
      console.error('[quota] status failed:', error);
      return jsonResponse(503, { error: 'Limit holatini olib bo‘lmadi.' });
    }
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Faqat GET va POST so‘rovlari qabul qilinadi.' });
  }
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'So‘rov juda katta. Kamroq yoki kichikroq rasm yuboring.' });
  }

  if (overRateLimit(getClientIp(request))) {
    return jsonResponse(429, { error: 'So‘rovlar limiti tugadi. Iltimos, 10 daqiqadan keyin urinib ko‘ring.' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'So‘rov tanasi to‘g‘ri JSON formatida emas.' });
  }
  const validated = validateMessages(body?.messages);
  if (!validated) {
    return jsonResponse(400, { error: 'Xabarlar ro‘yxati bo‘sh yoki noto‘g‘ri. Har bir xabar 4000 belgidan oshmasin, rasmlar 3 tadan ko‘p bo‘lmasin.' });
  }
  const { messages, images } = validated;
  if (typeof body.webSearch !== 'boolean') {
    return jsonResponse(400, { error: 'webSearch mantiqiy qiymat bo‘lishi kerak.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, { error: 'AI xizmati sozlanmagan: serverda GROQ_API_KEY qiymatini kiriting.' });
  }

  // Kunlik limit: savol oldindan band qilinadi, Groq javob bera olmasa qaytariladi.
  let reservation;
  try {
    reservation = await reserveQuestion(await identifyStudent(request));
  } catch (error) {
    console.error('[quota] reserve failed:', error);
    return jsonResponse(503, { error: 'Savollar limitini tekshirib bo‘lmadi. Birozdan so‘ng urinib ko‘ring.' });
  }
  if (!reservation.allowed) {
    return jsonResponse(429, { error: 'Bugungi savollar tugadi. Ertaga 00:00 da (Toshkent vaqti) yangilanadi.', code: 'daily_limit', quota: reservation.quota });
  }

  const speaking = body.mode === 'ielts-speaking';
  const uiLanguage = UI_LANGUAGES[body.language] || UI_LANGUAGES.uz;
  let notes = { used: [], text: '' };
  if (!speaking && messages.at(-1).content.trim()) {
    try {
      notes = buildNotesContext(await findRelevantNotes(messages.at(-1).content));
    } catch (error) {
      console.error('Tutor knowledge base could not be loaded:', error);
      await reservation.release();
      return jsonResponse(500, { error: 'Platforma konspektlarini o‘qishda xatolik yuz berdi.' });
    }
  }

  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 100) : 'general';
  const history = messages.slice(0, -1);
  const question = messages.at(-1);
  const questionMessage = (attempt) => (attempt.vision
    ? {
      role: 'user',
      content: [
        { type: 'text', text: question.content.trim() || IMAGE_ONLY_QUESTION },
        ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
      ],
    }
    : question);
  const systemPrompt = (attempt) => (speaking
    ? [IELTS_SPEAKING_PROMPT, `Write feedback explanations in ${uiLanguage}; keep examiner questions, corrections and model answers in English.`]
    : [
      TUTOR_SYSTEM_PROMPT,
      `Selected subject: ${subject}.`,
      ...(attempt.search === 'browser' || attempt.search === 'compound' ? [WEB_SEARCH_ON] : []),
      ...(attempt.search === 'unavailable' ? [attempt.vision ? WEB_SEARCH_WITH_IMAGES : WEB_SEARCH_UNAVAILABLE] : []),
    ]).join('\n\n');
  const buildMessages = (attempt) => [
    { role: 'system', content: systemPrompt(attempt) },
    ...history,
    // Konspekt oxirgi savoldan oldin alohida kontekst sifatida turadi.
    ...(notes.text ? [{ role: 'system', content: notes.text }] : []),
    questionMessage(attempt),
  ];

  const endpoint = `${groqBaseUrl()}/chat/completions`;
  const makeRequest = (attempt, signal) => fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: attempt.model,
      messages: buildMessages(attempt),
      stream: true,
      // Konspekt bo'lsa — past temperature: misollar konspektdan aynan ko'chirilsin.
      temperature: notes.text ? temperatureWithNotes() : temperatureDefault(),
      ...(attempt.search === 'browser' ? { tools: [{ type: 'browser_search' }] } : {}),
      // Qwen fikrlash matnini javobga aralashtirmasin.
      ...(/qwen/i.test(attempt.model) ? { reasoning_format: 'hidden' } : {}),
    }),
    signal,
  });

  return streamAnswer({
    attempts: planAttempts(body.webSearch && !speaking, images.length > 0),
    makeRequest,
    notes: notes.used,
    reservation,
    requestSignal: request.signal,
  });
}

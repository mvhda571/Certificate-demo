import { findRelevantNotes } from './knowledge.mjs';
import { TUTOR_SYSTEM_PROMPT, WEB_SEARCH_ON, WEB_SEARCH_UNAVAILABLE } from './prompt.mjs';

const WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 20;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const NOTES_CHAR_BUDGET = 6000;
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const rateLimits = new Map();

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function overRateLimit(ip) {
  const now = Date.now();
  const active = (rateLimits.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (active.length >= REQUEST_LIMIT) {
    rateLimits.set(ip, active);
    return true;
  }
  active.push(now);
  rateLimits.set(ip, active);
  return false;
}

function validateMessages(value) {
  if (!Array.isArray(value) || value.length === 0) return null;
  const messages = value.slice(-MAX_MESSAGES);
  if (messages.some((message) => (
    !message
    || !['user', 'assistant'].includes(message.role)
    || typeof message.content !== 'string'
    || !message.content.trim()
    || message.content.length > MAX_MESSAGE_LENGTH
  ))) return null;
  if (messages.at(-1).role !== 'user') return null;
  return messages.map(({ role, content }) => ({ role, content }));
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
  return {
    used,
    text: used.length
      ? `PLATFORM NOTES (konspekt) for the student's next question. Base the answer only on these notes.\n\n${parts.join('\n\n---\n\n')}`
      : '',
  };
}

const supportsBrowserSearch = (model) => /^openai\/gpt-oss-(120b|20b)$/.test(model);
const isCompound = (model) => model.startsWith('groq/compound');

// Internet so'ralganda modellarni navbat bilan sinaymiz; oxirgi variant — internetsiz javob.
function planAttempts(webSearch) {
  const baseModel = process.env.GROQ_MODEL || DEFAULT_MODEL;
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

function ndjsonStream({ upstream, attempt, notes, fallback, log }) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const tools = createToolTracker();
  const noteMeta = notes.map(({ title, fan, sinf, heading, file }) => ({ title, fan, sinf, heading, file }));
  const searchStatus = () => {
    if (attempt.search === 'off') return 'off';
    if (attempt.search === 'unavailable') return 'unavailable';
    return tools.executed ? 'ok' : 'unused';
  };

  const body = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ type: 'sources', web: [], notes: noteMeta, search: attempt.search === 'off' ? 'off' : 'pending' });
      let announcedSearch = false;

      const handleEvent = (event) => {
        const choice = event.choices?.[0];
        const delta = choice?.delta || choice?.message || {};
        if (typeof delta.content === 'string' && delta.content) send({ type: 'delta', text: delta.content });
        for (const tool of [delta.executed_tools, choice?.executed_tools, event.executed_tools].flat()) {
          if (!tool) continue;
          tools.handle(tool);
          if (!announcedSearch) {
            announcedSearch = true;
            send({ type: 'status', status: 'searching' });
          }
        }
      };

      try {
        const reader = upstream.body.getReader();
        let buffer = '';
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

        const web = tools.sources();
        console.info(`[tutor] model=${attempt.model} search=${searchStatus()} fallback=${fallback} tools=[${tools.log.join(', ')}] web=${web.length} notes=[${notes.map((note) => note.file).join(', ')}] attempts=[${log.join(' → ')}]`);
        send({ type: 'sources', web, notes: noteMeta, search: searchStatus() });
        send({ type: 'done', model: attempt.model, fallback });
        controller.close();
      } catch (error) {
        if (error?.name !== 'AbortError') console.error('[tutor] stream failed:', error);
        send({ type: 'error', message: error instanceof Error ? error.message : 'Stream uzilib qoldi.' });
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function handleTutorRequest(request) {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Faqat POST so‘rovlari qabul qilinadi.' });
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
  const messages = validateMessages(body?.messages);
  if (!messages) {
    return jsonResponse(400, { error: 'Xabarlar ro‘yxati bo‘sh yoki noto‘g‘ri. Har bir xabar 4000 belgidan oshmasin.' });
  }
  if (typeof body.webSearch !== 'boolean') {
    return jsonResponse(400, { error: 'webSearch mantiqiy qiymat bo‘lishi kerak.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, { error: 'AI xizmati sozlanmagan: serverda GROQ_API_KEY qiymatini kiriting.' });
  }

  let notes;
  try {
    notes = buildNotesContext(await findRelevantNotes(messages.at(-1).content));
  } catch (error) {
    console.error('Tutor knowledge base could not be loaded:', error);
    return jsonResponse(500, { error: 'Platforma konspektlarini o‘qishda xatolik yuz berdi.' });
  }

  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 100) : 'general';
  const history = messages.slice(0, -1);
  const question = messages.at(-1);
  const buildMessages = (attempt) => [
    {
      role: 'system',
      content: [
        TUTOR_SYSTEM_PROMPT,
        `Selected subject: ${subject}.`,
        ...(attempt.search === 'browser' || attempt.search === 'compound' ? [WEB_SEARCH_ON] : []),
        ...(attempt.search === 'unavailable' ? [WEB_SEARCH_UNAVAILABLE] : []),
      ].join('\n\n'),
    },
    ...history,
    // Konspekt oxirgi savoldan oldin alohida kontekst sifatida turadi.
    ...(notes.text ? [{ role: 'system', content: notes.text }] : []),
    question,
  ];

  const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;
  const makeRequest = (attempt) => fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: attempt.model,
      messages: buildMessages(attempt),
      stream: true,
      ...(attempt.search === 'browser' ? { tools: [{ type: 'browser_search' }] } : {}),
      // Qwen fikrlash matnini javobga aralashtirmasin.
      ...(/qwen/i.test(attempt.model) ? { reasoning_format: 'hidden' } : {}),
    }),
    signal: request.signal,
  });

  const attempts = planAttempts(body.webSearch);
  const log = [];
  try {
    for (const [index, attempt] of attempts.entries()) {
      const upstream = await makeRequest(attempt);
      if (upstream.ok && upstream.body) {
        log.push(`${attempt.model}/${attempt.search}:ok`);
        return ndjsonStream({ upstream, attempt, notes: notes.used, fallback: index > 0, log });
      }
      const details = (await upstream.text().catch(() => '')).slice(0, 300);
      log.push(`${attempt.model}/${attempt.search}:${upstream.status}`);
      console.warn(`[tutor] Groq request failed (${attempt.model}, search=${attempt.search}, ${upstream.status}): ${details}`);
      // Groq limiti (masalan, bepul tarifda 8000 token/daqiqa) — boshqa modelga o'tish ham shu limitga uriladi.
      if (upstream.status === 429) {
        const seconds = Math.ceil(Number(details.match(/try again in ([\d.]+)s/)?.[1]) || Number(upstream.headers.get('retry-after')) || 30);
        console.error(`[tutor] rate limited: ${log.join(' → ')}`);
        return jsonResponse(429, { error: `AI so‘rovlar limiti vaqtincha tugadi. ${seconds} soniyadan keyin qayta urinib ko‘ring.` });
      }
    }
    console.error(`[tutor] all attempts failed: ${log.join(' → ')}`);
    return jsonResponse(502, { error: 'AI javob bera olmadi. Birozdan so‘ng qayta urinib ko‘ring.' });
  } catch (error) {
    if (error.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    console.error('Tutor request failed:', error);
    return jsonResponse(502, { error: 'AI xizmatiga ulanishda xatolik yuz berdi.' });
  }
}

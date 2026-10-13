import { findRelevantNotes } from './knowledge.mjs';
import { TUTOR_SYSTEM_PROMPT } from './prompt.mjs';

const WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 20;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
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
  return messages.map(({ role, content }) => ({ role, content }));
}

function safeSources(value, sources, depth = 0) {
  if (depth > 7 || value == null) return;
  if (Array.isArray(value)) {
    for (const entry of value) safeSources(entry, sources, depth + 1);
    return;
  }
  if (typeof value !== 'object') return;

  const title = typeof value.title === 'string' ? value.title.trim().slice(0, 300) : '';
  const rawUrl = typeof value.url === 'string' ? value.url.trim() : '';
  if (title && rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        sources.set(url.href, { title, url: url.href });
      }
    } catch {
      // Ignore malformed URLs returned by an external search tool.
    }
  }

  for (const [key, child] of Object.entries(value)) {
    if (/executed_tools|search|result|sources|web/i.test(key)) {
      safeSources(child, sources, depth + 1);
    }
  }
}

function formatNotes(notes) {
  return notes.map((note, index) => (
    `[${index + 1}] ${note.title} | ${note.fan || 'Nomaʼlum fan'} | ${note.sinf || 'Sinf koʼrsatilmagan'}\n${note.heading}\n${note.content}`
  )).join('\n\n');
}

function ndjsonStream(upstream, model, notes) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const sources = new Map();
  const web = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({
        type: 'sources',
        web: [],
        notes: notes.map(({ title, fan, sinf, heading }) => ({ title, fan, sinf, heading })),
      });

      try {
        const reader = upstream.body.getReader();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            let event;
            try {
              event = JSON.parse(data);
            } catch {
              continue;
            }
            const choice = event.choices?.[0];
            const delta = choice?.delta || choice?.message || {};
            if (typeof delta.content === 'string' && delta.content) {
              send({ type: 'delta', text: delta.content });
            }
            safeSources(delta.executed_tools || delta, sources);
            safeSources(choice?.executed_tools, sources);
            safeSources(event.executed_tools, sources);
            if (done) break;
          }
          if (done) break;
        }
        if (buffer.startsWith('data:')) {
          const data = buffer.slice(5).trim();
          if (data && data !== '[DONE]') {
            try {
              const event = JSON.parse(data);
              safeSources(event.choices?.[0]?.delta?.executed_tools || event.executed_tools, sources);
            } catch {
              // An incomplete final SSE line is not a usable event.
            }
          }
        }
        send({ type: 'sources', web: [...sources.values()], notes: notes.map(({ title, fan, sinf, heading }) => ({ title, fan, sinf, heading })) });
        send({ type: 'done', model });
        controller.close();
      } catch (error) {
        send({ type: 'error', message: error instanceof Error ? error.message : 'Stream uzilib qoldi.' });
        controller.close();
      }
    },
  });

  return new Response(web, {
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
    notes = await findRelevantNotes(messages.at(-1).content);
  } catch (error) {
    console.error('Tutor knowledge base could not be loaded:', error);
    return jsonResponse(500, { error: 'Platforma konspektlarini o‘qishda xatolik yuz berdi.' });
  }

  const model = body.webSearch
    ? process.env.GROQ_SEARCH_MODEL || 'groq/compound'
    : process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const fallbackModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const systemContent = [
    TUTOR_SYSTEM_PROMPT,
    `Selected subject: ${typeof body.subject === 'string' ? body.subject.slice(0, 100) : 'General'}.`,
    ...(notes.length ? [`Platform notes follow. Use them when relevant:\n\n${formatNotes(notes)}`] : []),
  ].join('\n\n');
  const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;
  const makeRequest = (requestedModel) => fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: requestedModel,
      messages: [{ role: 'system', content: systemContent }, ...messages],
      stream: true,
    }),
    signal: request.signal,
  });

  try {
    let upstream = await makeRequest(model);
    let activeModel = model;
    if (!upstream.ok && body.webSearch && model !== fallbackModel) {
      await upstream.body?.cancel();
      upstream = await makeRequest(fallbackModel);
      activeModel = fallbackModel;
    }
    if (!upstream.ok) {
      const details = (await upstream.text()).slice(0, 500);
      console.error(`Groq request failed (${upstream.status}): ${details}`);
      return jsonResponse(502, { error: 'AI javob bera olmadi. Birozdan so‘ng qayta urinib ko‘ring.' });
    }
    if (!upstream.body) {
      return jsonResponse(502, { error: 'AI xizmatidan oqimli javob olinmadi.' });
    }
    return ndjsonStream(upstream, activeModel, notes);
  } catch (error) {
    if (error.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    console.error('Tutor request failed:', error);
    return jsonResponse(502, { error: 'AI xizmatiga ulanishda xatolik yuz berdi.' });
  }
}

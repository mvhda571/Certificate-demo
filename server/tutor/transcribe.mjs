import { createRateLimiter, getClientIp, groqBaseUrl, jsonResponse, retryAfterSeconds } from './http.mjs';

// 60 soniyalik ovoz (webm/opus) odatda < 1 MB; Vercel funksiyasi tanasi 4.5 MB bilan cheklangan.
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const LANGUAGES = new Set(['uz', 'ru', 'en']);
const AUDIO_TYPES = /^audio\/(webm|ogg|mp4|mpeg|mp3|wav|x-wav|m4a|x-m4a|aac|flac)\b/;
const overRateLimit = createRateLimiter({ windowMs: 10 * 60 * 1000, limit: 15 });

export async function handleTranscribeRequest(request) {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Faqat POST so‘rovlari qabul qilinadi.' });
  }
  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > MAX_AUDIO_BYTES + 64 * 1024) {
    return jsonResponse(413, { error: 'Ovozli xabar juda katta. 60 soniyagacha yozing.' });
  }
  if (overRateLimit(getClientIp(request))) {
    return jsonResponse(429, { error: 'Ovozli so‘rovlar limiti tugadi. 10 daqiqadan keyin urinib ko‘ring.' });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse(400, { error: 'Audio fayl multipart/form-data ko‘rinishida yuborilishi kerak.' });
  }
  const file = form.get('file');
  if (!file || typeof file === 'string' || !file.size) {
    return jsonResponse(400, { error: 'Audio fayl topilmadi.' });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return jsonResponse(413, { error: 'Ovozli xabar juda katta. 60 soniyagacha yozing.' });
  }
  if (file.type && !AUDIO_TYPES.test(file.type)) {
    return jsonResponse(415, { error: 'Bu audio format qo‘llab-quvvatlanmaydi.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, { error: 'AI xizmati sozlanmagan: serverda GROQ_API_KEY qiymatini kiriting.' });
  }

  const language = String(form.get('language') || '');
  const model = process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo';
  const upstreamForm = new FormData();
  upstreamForm.append('file', file, file.name || 'voice.webm');
  upstreamForm.append('model', model);
  upstreamForm.append('response_format', 'json');
  upstreamForm.append('temperature', '0');
  if (LANGUAGES.has(language)) upstreamForm.append('language', language);

  try {
    const upstream = await fetch(`${groqBaseUrl()}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
      signal: request.signal,
    });
    if (!upstream.ok) {
      const details = (await upstream.text().catch(() => '')).slice(0, 300);
      console.warn(`[transcribe] Groq failed (${model}, ${upstream.status}): ${details}`);
      if (upstream.status === 429) {
        return jsonResponse(429, { error: `Ovozni matnga aylantirish limiti tugadi. ${retryAfterSeconds(details, upstream.headers)} soniyadan keyin urinib ko‘ring.` });
      }
      return jsonResponse(502, { error: 'Ovozni matnga aylantirib bo‘lmadi. Qayta urinib ko‘ring yoki savolni yozib yuboring.' });
    }
    const result = await upstream.json();
    const text = typeof result.text === 'string' ? result.text.trim() : '';
    console.info(`[transcribe] model=${model} language=${language || 'auto'} bytes=${file.size} chars=${text.length}`);
    return jsonResponse(200, { text });
  } catch (error) {
    if (error.name === 'AbortError') return new Response(null, { status: 499 });
    console.error('[transcribe] request failed:', error);
    return jsonResponse(502, { error: 'Ovozni matnga aylantirish xizmatiga ulanib bo‘lmadi.' });
  }
}

export function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function getClientIp(request) {
  // Netlify haqiqiy mijoz IP'sini x-nf-client-connection-ip sarlavhasida beradi.
  return request.headers.get('x-nf-client-connection-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

// Oddiy xotiradagi limit: har bir IP uchun windowMs ichida ko'pi bilan `limit` ta so'rov.
export function createRateLimiter({ windowMs, limit }) {
  const hits = new Map();
  return function overLimit(key) {
    const now = Date.now();
    const active = (hits.get(key) || []).filter((time) => now - time < windowMs);
    const blocked = active.length >= limit;
    if (!blocked) active.push(now);
    hits.set(key, active);
    return blocked;
  };
}

export function groqBaseUrl() {
  return (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
}

// Groq 429 javobidan "N soniyadan keyin" qiymatini oladi.
export function retryAfterSeconds(details, headers) {
  return Math.ceil(Number(details.match(/try again in ([\d.]+)s/)?.[1]) || Number(headers.get('retry-after')) || 30);
}

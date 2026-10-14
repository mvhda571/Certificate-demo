import { createHash } from 'node:crypto';
import { getClientIp } from './http.mjs';

// Google ID token (GIS "credential") imzosini Google ochiq kalitlari bilan tekshiramiz.
const CERTS_URL = () => process.env.GOOGLE_CERTS_URL || 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
// GIS tokeni 1 soat amal qiladi; kvota uchun faqat "kim ekanligi" kerak, shuning uchun
// imzosi to'g'ri tokenni 7 kungacha qabul qilamiz (keyin o'quvchi qayta kirishi kerak).
const MAX_TOKEN_AGE_SECONDS = 7 * 24 * 60 * 60;
const DEVICE_ID = /^[A-Za-z0-9-]{8,64}$/;

let certsCache = { keys: [], expiresAt: 0 };
let warnedNoClientId = false;

const base64UrlToBuffer = (value) => Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const decodeJson = (value) => JSON.parse(base64UrlToBuffer(value).toString('utf8'));

async function googleKeys(forceRefresh = false) {
  if (!forceRefresh && certsCache.keys.length && Date.now() < certsCache.expiresAt) return certsCache.keys;
  const response = await fetch(CERTS_URL());
  if (!response.ok) throw new Error(`Google certs ${response.status}`);
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]) || 3600;
  const { keys } = await response.json();
  certsCache = { keys: Array.isArray(keys) ? keys : [], expiresAt: Date.now() + maxAge * 1000 };
  return certsCache.keys;
}

export function googleClientId() {
  return String(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

export async function verifyGoogleIdToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const clientId = googleClientId();
  if (!clientId) {
    if (!warnedNoClientId) console.warn('[identity] GOOGLE_CLIENT_ID (yoki VITE_GOOGLE_CLIENT_ID) yo‘q — Google tokenlari tekshirilmaydi, qurilma id ishlatiladi.');
    warnedNoClientId = true;
    return null;
  }

  let header;
  let payload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;

  let jwk = (await googleKeys()).find((key) => key.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find((key) => key.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, base64UrlToBuffer(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) return null;

  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!ISSUERS.has(payload.iss) || !audience.includes(clientId) || !payload.sub) return null;
  if (!payload.iat || now - payload.iat > MAX_TOKEN_AGE_SECONDS || payload.iat - now > 300) return null;

  return {
    sub: String(payload.sub),
    email: payload.email_verified === true || payload.email_verified === 'true' ? String(payload.email || '').toLowerCase() : '',
  };
}

// O'quvchini aniqlash: tekshirilgan Google akkaunti, bo'lmasa IP + qurilma id (ishonchsiz, chetlab o'tish mumkin).
export async function identifyStudent(request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    try {
      const google = await verifyGoogleIdToken(token);
      if (google) return { id: `g:${google.sub}`, kind: 'google', email: google.email };
    } catch (error) {
      console.warn('[identity] Google tokenini tekshirib bo‘lmadi:', error.message);
    }
  }
  const device = request.headers.get('x-tutor-device') || '';
  const hash = createHash('sha256')
    .update(`${getClientIp(request)}|${DEVICE_ID.test(device) ? device : 'no-device'}`)
    .digest('hex')
    .slice(0, 24);
  return { id: `d:${hash}`, kind: 'device', email: '' };
}

export function isUnlimited(student) {
  if (!student.email) return false;
  const emails = String(process.env.TUTOR_UNLIMITED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return emails.includes(student.email);
}

import { Redis } from '@upstash/redis';
import { isUnlimited } from './identity.mjs';

// Har bir o'quvchiga kunlik savollar limiti. Kun Toshkent vaqti (UTC+5) bilan 00:00 da yangilanadi.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const KEY_TTL_SECONDS = 48 * 60 * 60;

let redis;
let warnedMemory = false;
const memory = new Map();

function store() {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  if (!redis && !warnedMemory) {
    console.warn('[quota] UPSTASH_REDIS_REST_URL/TOKEN yo‘q — kunlik limit xotirada saqlanadi (server qayta ishga tushsa nolga tushadi, nusxalar o‘rtasida umumiy emas).');
    warnedMemory = true;
  }
  return redis;
}

export function dailyLimit() {
  const value = Number.parseInt(process.env.TUTOR_DAILY_LIMIT, 10);
  return Number.isFinite(value) && value > 0 ? value : 10;
}

export function tashkentDay(now = Date.now()) {
  return new Date(now + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

// Keyingi Toshkent yarim tuni (UTC ko'rinishida).
export function nextReset(now = Date.now()) {
  const local = new Date(now + TASHKENT_OFFSET_MS);
  local.setUTCHours(24, 0, 0, 0);
  return new Date(local.getTime() - TASHKENT_OFFSET_MS).toISOString();
}

const quotaKey = (student, now) => `tutor:${student.id}:${tashkentDay(now)}`;

async function readCount(key) {
  const client = store();
  if (client) return Number(await client.get(key)) || 0;
  const entry = memory.get(key);
  return entry && entry.expiresAt > Date.now() ? entry.count : 0;
}

async function increment(key) {
  const client = store();
  if (client) {
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, KEY_TTL_SECONDS);
    return count;
  }
  const entry = memory.get(key);
  const count = (entry && entry.expiresAt > Date.now() ? entry.count : 0) + 1;
  memory.set(key, { count, expiresAt: Date.now() + KEY_TTL_SECONDS * 1000 });
  return count;
}

async function decrement(key) {
  const client = store();
  if (client) {
    await client.decr(key);
    return;
  }
  const entry = memory.get(key);
  if (entry && entry.count > 0) entry.count -= 1;
}

function describe(count, now, unlimited) {
  const limit = dailyLimit();
  return {
    limit,
    used: Math.min(count, limit),
    remaining: unlimited ? null : Math.max(0, limit - count),
    resetAt: nextReset(now),
    unlimited,
  };
}

export async function getQuota(student) {
  const now = Date.now();
  const unlimited = isUnlimited(student);
  return describe(unlimited ? 0 : await readCount(quotaKey(student, now)), now, unlimited);
}

// Savolni oldindan band qiladi. Groq xato bersa release() chaqiriladi va savol hisobdan chiqadi.
export async function reserveQuestion(student) {
  const now = Date.now();
  if (isUnlimited(student)) {
    return { allowed: true, quota: describe(0, now, true), release: async () => {} };
  }
  const key = quotaKey(student, now);
  const count = await increment(key);
  if (count > dailyLimit()) {
    await decrement(key);
    return { allowed: false, quota: describe(dailyLimit(), now, false), release: async () => {} };
  }
  let released = false;
  return {
    allowed: true,
    quota: describe(count, now, false),
    release: async () => {
      if (released) return;
      released = true;
      await decrement(key).catch((error) => console.error('[quota] release failed:', error));
    },
  };
}

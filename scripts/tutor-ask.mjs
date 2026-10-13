// AI Tutor'ni terminaldan sinash (haqiqiy .env kaliti bilan, kalit chop etilmaydi).
// Foydalanish: npm run tutor:ask -- "Kishilik olmoshlari nima?" [--web] [--model=openai/gpt-oss-20b]
import { readFileSync } from 'node:fs';
import { handleTutorRequest } from '../server/tutor/handler.mjs';

const args = process.argv.slice(2);
const question = args.find((arg) => !arg.startsWith('--'));
const webSearch = args.includes('--web');
const model = args.find((arg) => arg.startsWith('--model='))?.slice('--model='.length);
if (!question) {
  console.log('Foydalanish: npm run tutor:ask -- "savol" [--web] [--model=<groq model id>]');
  process.exit(1);
}

try {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^(GROQ_[A-Z_]+)=(.*)$/);
    if (match && match[2].trim() && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
  }
} catch {
  // .env bo'lmasa, muhit o'zgaruvchilaridan foydalanamiz.
}
if (model) process.env.GROQ_MODEL = model;

const started = Date.now();
const response = await handleTutorRequest(new Request('http://localhost/api/tutor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `cli-${process.pid}` },
  body: JSON.stringify({ messages: [{ role: 'user', content: question }], subject: 'general', webSearch }),
}));
if (!response.ok) {
  console.log(`HTTP ${response.status}`, await response.text());
  process.exit(1);
}

let answer = '';
let sources = {};
let done = {};
for (const line of (await response.text()).split('\n').filter(Boolean)) {
  const event = JSON.parse(line);
  if (event.type === 'delta') answer += event.text;
  else if (event.type === 'sources') sources = event;
  else if (event.type === 'done') done = event;
  else if (event.type === 'error') console.log('XATO:', event.message);
}
console.log(`\nmodel: ${done.model} | internet: ${sources.search} | ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log(`konspekt: ${(sources.notes || []).map((note) => note.file).join(', ') || '—'}`);
console.log(`manbalar: ${(sources.web || []).map((source) => `${source.title} <${source.url}>`).join('\n          ') || '—'}`);
console.log(`\n${answer}\n`);

import { normalizeApostrophes } from './knowledge.mjs';

// "Ko'p uchraydigan xato" qatorlarini (❌ noto'g'ri → ✅ to'g'ri) konspekt bilan solishtiradi.
// Model ba'zan ✅ tomoniga ham noto'g'ri shakl yozadi (masalan "✅ senning") — bunday qator o'quvchiga yuborilmaydi.

const MISTAKE_LINE = /^\s*(?:[-*+]\s+|\d+[.)]\s+)?(?:\*\*|_)?❌/u;
// Hali "❌" bilan boshlanishi mumkin bo'lgan qator boshi (bo'sh joy yoki ro'yxat belgisi).
const POSSIBLE_PREFIX = /^\s*(?:[-*+]\s*|\d+[.)]?\s*)?(?:\*\*|_)?$/u;
const WORD = /[\p{L}\p{N}']+/gu;

const words = (text) => normalizeApostrophes(String(text).toLocaleLowerCase()).match(WORD) || [];
const stripMarkdown = (text) => text.replace(/[*_`~]/g, '');

// ✅ dan keyingi asosiy shakl: izoh qavslari, tire yoki ikki nuqtagacha.
function correctPart(line) {
  const after = line.slice(line.indexOf('✅') + 1);
  return stripMarkdown(after.split(/\s[—–-]\s|[(:;]|\s\/\s/u)[0]).trim();
}

function wrongPart(line) {
  const start = line.indexOf('❌') + 1;
  const end = line.indexOf('✅');
  return stripMarkdown(line.slice(start, end).replace(/(→|->|=>)\s*$/u, '')).trim();
}

export function checkMistakeLine(line, referenceWords) {
  if (!line.includes('✅')) return { ok: true };
  const correct = words(correctPart(line));
  const wrong = words(wrongPart(line));
  if (!correct.length) return { ok: false, reason: 'empty correct form' };
  if (wrong.join(' ') === correct.join(' ')) return { ok: false, reason: 'wrong form equals correct form' };
  const missing = correct.filter((word) => !referenceWords.has(word));
  if (missing.length) return { ok: false, reason: `not in notes: ${missing.join(', ')}` };
  return { ok: true };
}

// Oqim filtri: odatiy matn darhol o'tadi, faqat "❌" qatorlari to'liq bo'lguncha ushlab turiladi.
export function createMistakeFilter(referenceText) {
  const referenceWords = new Set(words(referenceText));
  const dropped = [];
  let pending = '';
  let passthrough = false;

  const finishLine = (line) => {
    if (!MISTAKE_LINE.test(line)) return line;
    const result = checkMistakeLine(line, referenceWords);
    if (result.ok) return line;
    dropped.push(`${line.trim()} (${result.reason})`);
    return null;
  };

  return {
    dropped,
    push(text) {
      let output = '';
      let rest = text;
      while (rest) {
        const newline = rest.indexOf('\n');
        const chunk = newline === -1 ? rest : rest.slice(0, newline);
        rest = newline === -1 ? '' : rest.slice(newline + 1);
        const complete = newline !== -1;

        if (passthrough) {
          output += chunk + (complete ? '\n' : '');
          if (complete) passthrough = false;
          continue;
        }
        pending += chunk;
        if (complete) {
          const line = finishLine(pending);
          if (line !== null) output += `${line}\n`;
          pending = '';
        } else if (!MISTAKE_LINE.test(pending) && !POSSIBLE_PREFIX.test(pending)) {
          // Oddiy qator — kutmasdan yuboramiz.
          output += pending;
          pending = '';
          passthrough = true;
        }
      }
      return output;
    },
    flush() {
      const line = pending ? finishLine(pending) : '';
      pending = '';
      passthrough = false;
      return line || '';
    },
  };
}

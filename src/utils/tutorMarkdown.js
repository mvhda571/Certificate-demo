// Kod bloklari (```...```, ~~~...~~~) va inline `kod` — ularning ichiga tegilmaydi.
const CODE_SEGMENTS = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/g;

function normalizeMath(text) {
  return text
    // \[ ... \]  →  $$ ... $$ (alohida qatorlarda, aks holda remark-math display deb tanimaydi)
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, formula) => `\n$$\n${formula.trim()}\n$$\n`)
    // \( ... \)  →  $ ... $
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, formula) => `$${formula.trim()}$`);
}

// 【3†L11-L13】 → [1](url) — 3 bu browser_search "cursor" raqami; mos sahifa bo'lmasa belgi olib tashlanadi.
function normalizeCitations(text, webSources) {
  return text
    .replace(/\s?【(\d+)(?:†[^】]*)?】/g, (_, cursor) => {
      const index = webSources.findIndex((source) => source.cursor === Number(cursor));
      return index === -1 ? '' : ` [[${index + 1}]](${webSources[index].url})`;
    })
    .replace(/【[^】]*】/g, '')
    // Stream paytida hali yopilmagan belgi ko'rinmasin.
    .replace(/【[^】]*$/, '');
}

export function normalizeTutorMarkdown(text, webSources = []) {
  const withoutThinking = String(text || '').replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '');
  return withoutThinking
    .split(CODE_SEGMENTS)
    .map((part, index) => (index % 2 === 1 ? part : normalizeCitations(normalizeMath(part), webSources)))
    .join('');
}

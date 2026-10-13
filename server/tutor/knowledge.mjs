import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const notesRoot = path.resolve(process.cwd(), 'src', 'data', 'konspekt');
// Aloqasiz savollarga (salomlashish, IELTS narxi va h.k.) konspekt biriktirilmasligi uchun.
const MIN_SCORE = 0.2;
const MIN_MATCHED_TERMS = 2;
const STOP_WORDS = new Set([
  // o'zbekcha
  'va', 'bilan', 'uchun', 'haqida', 'nima', 'nimalar', 'qanday', 'qaysi', 'kim', 'bu', 'shu', 'ham', 'esa',
  'emas', 'edi', 'bor', "yo'q", 'menga', 'iltimos', 'salom', 'assalomu', 'alaykum', 'rahmat', 'qalaysan',
  'qalaysiz', 'yaxshi', 'nega', 'qachon', 'qayerda', 'nechta', 'qancha', 'tushuntir', 'tushuntiring',
  'tushuntirib', 'ber', 'bering', 'ayt', 'ayting', 'aytib', 'misol', 'savol', 'javob', 'mavzu', 'mavzusi',
  // English
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'what', 'how', 'why', 'tips',
  'please', 'explain', 'hello', 'hi', 'me', 'about',
  // русский
  'и', 'в', 'на', 'с', 'что', 'как', 'это', 'по', 'для', 'не', 'привет', 'объясни', 'про',
]);
let knowledgePromise;

export function normalizeApostrophes(value) {
  return value.replace(/[‘’ʻ]/g, "'");
}

function metadataValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'mi'));
  return match ? match[1].replace(/^["']|["']$/g, '').trim() : '';
}

function parseDocument(file, raw) {
  const normalized = normalizeApostrophes(raw.replace(/^\uFEFF/, ''));
  const frontmatterMatch = normalized.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  const frontmatter = frontmatterMatch?.[1] || '';
  const body = frontmatterMatch ? normalized.slice(frontmatterMatch[0].length) : normalized;
  const metadata = {
    title: metadataValue(frontmatter, 'title') || path.basename(file, '.md'),
    fan: metadataValue(frontmatter, 'fan'),
    sinf: metadataValue(frontmatter, 'sinf'),
  };
  const sections = body.split(/(?=^##\s+)/m);

  return sections.map((section, index) => {
    const heading = section.match(/^##\s+(.+)$/m)?.[1]?.trim() || metadata.title;
    const content = section.trim();
    if (!content) return null;
    return {
      ...metadata,
      heading,
      content: content.slice(0, 7000),
      id: `${file}:${index}`,
    };
  }).filter(Boolean);
}

async function collectMarkdown(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectMarkdown(entryPath)
      : entry.isFile() && entry.name.toLowerCase().endsWith('.md')
        ? [entryPath]
        : [];
  }));
  return files.flat();
}

async function loadKnowledge() {
  const files = await collectMarkdown(notesRoot);
  const documents = await Promise.all(files.map(async (file) => ({
    file: path.relative(notesRoot, file),
    text: await readFile(file, 'utf8'),
  })));
  return documents.flatMap(({ file, text }) => parseDocument(file, text));
}

function tokenize(value) {
  return normalizeApostrophes(value.toLocaleLowerCase())
    .match(/[\p{L}\p{N}']+/gu) || [];
}

export async function findRelevantNotes(question, limit = 4) {
  knowledgePromise ||= loadKnowledge();
  const chunks = await knowledgePromise;
  const queryTerms = [...new Set(tokenize(question))]
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
  if (!chunks.length || !queryTerms.length) return [];
  const requiredMatches = Math.min(MIN_MATCHED_TERMS, queryTerms.length);

  const documents = chunks.map((chunk) => {
    const counts = new Map();
    for (const term of tokenize(`${chunk.heading} ${chunk.content}`)) {
      counts.set(term, (counts.get(term) || 0) + 1);
    }
    return counts;
  });
  const documentFrequency = new Map();
  for (const counts of documents) {
    for (const term of counts.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  const queryWeights = new Map(queryTerms.map((term) => [
    term,
    Math.log(1 + chunks.length / (1 + (documentFrequency.get(term) || 0))),
  ]));
  const queryNorm = Math.sqrt([...queryWeights.values()].reduce((sum, weight) => sum + weight ** 2, 0));
  const scored = documents.map((counts, index) => {
    let score = 0;
    let documentNorm = 0;
    let matchedTerms = 0;
    for (const [term, count] of counts) {
      const idf = Math.log(1 + chunks.length / (1 + (documentFrequency.get(term) || 0)));
      const documentWeight = (1 + Math.log(count)) * idf;
      documentNorm += documentWeight ** 2;
      const queryWeight = queryWeights.get(term);
      if (queryWeight) {
        score += queryWeight * documentWeight;
        matchedTerms += 1;
      }
    }
    return {
      chunk: chunks[index],
      matchedTerms,
      score: queryNorm && documentNorm ? score / (queryNorm * Math.sqrt(documentNorm)) : 0,
    };
  });

  return scored
    .filter(({ score, matchedTerms }) => score >= MIN_SCORE && matchedTerms >= requiredMatches)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk }) => chunk);
}

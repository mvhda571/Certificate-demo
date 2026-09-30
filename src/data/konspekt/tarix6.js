import quiz from './tarix-6/quiz.json'
import exams from './tarix-6/exams.json'
import flashcardsA from './tarix-6/flashcards-1.json'
import flashcardsB from './tarix-6/flashcards-2.json'

// Har bir mavzu uchun metodist tuzgan 20 talik flashcard to'plami.
const authoredFlashcards = { ...flashcardsA, ...flashcardsB }

// 6-sinf "Qadimgi dunyo tarixi" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./tarix-6/*.md', { query: '?raw', import: 'default', eager: true })

const QUICK_CHECK = 'Tez tekshiruv'
const TERMS = 'Atamalar'
const MAX_FLASHCARDS = 5

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta: {}, body: raw }
  const meta = Object.fromEntries(match[1].split(/\r?\n/).map(line => {
    const [key, ...rest] = line.split(':')
    return [key.trim(), rest.join(':').trim().replace(/^"(.*)"$/, '$1')]
  }))
  return { meta, body: raw.slice(match[0].length) }
}

function parseSections(body) {
  return body.split(/\r?\n(?=## )/).filter(part => part.startsWith('## ')).map(part => {
    const [heading, ...lines] = part.split(/\r?\n/)
    return { heading: heading.replace(/^##\s+/, '').trim(), body: lines.join('\n').trim() }
  })
}

const stripBold = (text) => text.replace(/\*\*/g, '').trim()

function makeFlashcards(sections) {
  const quick = sections.find(section => section.heading === QUICK_CHECK)?.body.split('\n') || []
  const cards = quick
    .map(line => line.match(/^\d+\.\s*(.+?)\s+—\s+(.+)$/))
    .filter(Boolean)
    .map(([, front, back]) => ({ front: stripBold(front), back: stripBold(back) }))
  const terms = sections.find(section => section.heading === TERMS)?.body.split('\n') || []
  for (const line of terms) {
    if (cards.length >= MAX_FLASHCARDS) break
    const match = line.match(/^-\s*\*\*(.+?)\*\*\s+—\s+(.+)$/)
    if (!match) continue
    const back = stripBold(match[2])
    cards.push({ front: `«${match[1]}» nima?`, back: back.charAt(0).toUpperCase() + back.slice(1) })
  }
  return cards.slice(0, MAX_FLASHCARDS)
}

const toQuestion = ({ q, o, a, e, t }) => ({ text: q, options: o, answer: a, explanation: e, topicId: t })

const topics = Object.entries(files)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw)
    const id = Number(meta.tartib)
    const sections = parseSections(body)
    return {
      id,
      title: meta.title,
      section: meta.bolim,
      slug: meta.slug || path.split('/').pop().replace(/\.md$/, ''),
      sections: sections.filter(section => section.heading !== QUICK_CHECK),
      flashcards: authoredFlashcards[id]?.map(([front, back]) => ({ front, back })) || makeFlashcards(sections),
      quiz: (quiz.topics[id] || []).map(toQuestion),
    }
  })
  .sort((a, b) => a.id - b.id)

export const history6Course = {
  topics,
  midterm: { title: 'Oraliq test', scope: '1–20-mavzular', lastTopic: 20, questions: exams.midterm.map(toQuestion) },
  final: { title: 'Yakuniy test', scope: 'Barcha 44 ta mavzu', lastTopic: topics.length, questions: exams.final.map(toQuestion) },
}

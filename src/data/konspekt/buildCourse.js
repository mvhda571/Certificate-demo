// Konspekt (.md) fayllari, testlar va flashcardlardan interaktiv kurs yig'adi.
// "Tez tekshiruv" bo'limi kursda ko'rsatilmaydi — uning o'rnini mavzu testi bosadi.
const QUICK_CHECK = ['Tez tekshiruv', 'Быстрая проверка']

const EXAM_TEXT = {
  uz: { midterm: 'Oraliq test', final: 'Yakuniy test', midtermScope: last => `1–${last}-mavzular`, finalScope: count => `Barcha ${count} ta mavzu` },
  ru: { midterm: 'Промежуточный тест', final: 'Итоговый тест', midtermScope: last => `темы 1–${last}`, finalScope: count => `Все темы (${count})` },
}

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

const toQuestion = ({ q, o, a, e, t }) => ({ text: q, options: o, answer: a, explanation: e, topicId: t })

export function buildCourse({ files, quiz, exams, flashcards, midtermLastTopic, lang = 'uz' }) {
  const text = EXAM_TEXT[lang] || EXAM_TEXT.uz
  const topics = Object.entries(files)
    .map(([path, raw]) => {
      const { meta, body } = parseFrontmatter(raw)
      // 10–11-sinf konspektlarida `tartib` ikki sinf bo'ylab davom etadi, sinf ichidagi raqam — `sinf_tartib`.
      const id = Number(meta.sinf_tartib || meta.tartib)
      const sections = parseSections(body)
      return {
        id,
        title: meta.title,
        section: meta.bolim,
        slug: meta.slug || path.split('/').pop().replace(/\.md$/, ''),
        sections: sections.filter(section => !QUICK_CHECK.includes(section.heading)),
        flashcards: (flashcards[id] || []).map(([front, back]) => ({ front, back })),
        quiz: (quiz.topics[id] || []).map(toQuestion),
      }
    })
    .sort((a, b) => a.id - b.id)

  return {
    topics,
    midterm: { title: text.midterm, scope: text.midtermScope(midtermLastTopic), lastTopic: midtermLastTopic, questions: exams.midterm.map(toQuestion) },
    final: { title: text.final, scope: text.finalScope(topics.length), lastTopic: topics.length, questions: exams.final.map(toQuestion) },
  }
}

import historyPdfNotes from './historyPdfNotes.json'

// Darslik PDF'i asosidagi eski tarix darslari. 6–11-sinflar konspekt kurslariga o'tgan (./konspekt), bu yerda faqat 5-sinf qoldi.
const grades = {
  5: { period: 'Tarixdan hikoyalar', count: 52 },
}

const makeQuestions = (lessons, upto) => {
  const available = lessons.slice(0, upto)
  return Array.from({ length: 5 }, (_, index) => {
    const source = available[index % available.length]
    const fact = source.facts[index % source.facts.length]
    const distractors = available.flatMap(item => item.facts).filter(item => item !== fact).slice(index, index + 3)
    while (distractors.length < 3) distractors.push('Mazkur davrga tegishli bo‘lmagan xulosa')
    const options = [fact, ...distractors].slice(0, 4)
    const shift = index % 4
    const rotated = [...options.slice(shift), ...options.slice(0, shift)]
    return { text: `${source.title} bo‘yicha to‘g‘ri tarixiy ma’lumotni aniqlang.`, options: rotated, answer: rotated.indexOf(fact) }
  })
}

export const historyGrades = Object.fromEntries(Object.entries(grades).map(([grade, data]) => {
  const lessons = historyPdfNotes[grade].map((item, index) => ({ ...item, id: index + 1, pages: item.pages || index + 1 }))
  const readyLessons = lessons.map((item, index) => ({ ...item, test: (index + 1) % 3 === 0 ? makeQuestions(lessons, index + 1) : null }))
  return [grade, {
    ...data, grade: Number(grade), pdf: `/textbooks/tarix-${grade}.pdf`, lessons: readyLessons,
    mock: Array.from({ length: 10 }, (_, index) => {
      const source = lessons[index % lessons.length]
      const fact = source.facts[index % source.facts.length]
      const pool = lessons.flatMap(item => item.facts).filter(item => item !== fact)
      return { text: `${source.title} doirasida tarixiy jihatdan asoslangan xulosani toping.`, options: [fact, ...pool.slice(index, index + 3)], answer: 0 }
    }),
  }]
}))

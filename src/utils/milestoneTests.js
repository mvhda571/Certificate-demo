const lessonAnswers = lesson => lesson.facts || lesson.formulas || lesson.rules || lesson.points || lesson.topics || [lesson.summary]

const shuffle = values => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export function generateMilestoneQuestions(lessons, total) {
  const validLessons = shuffle(lessons.filter(Boolean))
  const answerPool = validLessons.flatMap(lessonAnswers).filter(Boolean)
  if (!validLessons.length || !answerPool.length) return []
  return Array.from({ length: total }, (_, index) => {
    const lesson = validLessons[index % validLessons.length]
    const answers = lessonAnswers(lesson).filter(Boolean)
    const correct = answers[Math.floor(Math.random() * answers.length)]
    const candidates = shuffle([...new Set(answerPool.filter(answer => answer !== correct))])
    const distractors = candidates.length ? Array.from({ length: Math.min(3, candidates.length) }, (_, offset) => candidates[offset % candidates.length]) : []
    while (distractors.length < 3) distractors.push(`Bu “${lesson.title}” mavzusiga tegishli bo‘lmagan xulosa ${distractors.length + 1}`)
    const options = shuffle([correct, ...distractors])
    return {
      id: `milestone-${index + 1}`,
      topic: lesson.title,
      text: `${lesson.title} mavzusi bo‘yicha to‘g‘ri qoida yoki xulosani belgilang.`,
      options,
      answer: options.indexOf(correct),
      explanation: correct,
    }
  })
}

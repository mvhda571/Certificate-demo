import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SUBJECTS = [['matematika', 'matematika'], ['math', 'matematika'], ['ona-tili', 'ona-tili'], ['adabiyot', 'adabiyot'], ['tarix', 'tarix']]

// testId turli joylarda turlicha tuziladi ("ona-tili-6", "tarix-7-...", "math-uzbmb-...") — fan va sinfni shundan ajratamiz.
const subjectOf = testId => SUBJECTS.find(([prefix]) => String(testId || '').startsWith(prefix))?.[1] || 'other'
const gradeOf = testId => String(testId || '').match(/-(\d{1,2})(?=-|$)/)?.[1] || ''
const questionText = item => item.front || item.question || item.text || ''
// Bir savol har xil testlarda turli id bilan kelishi mumkin, shuning uchun fan + matn bo'yicha aniqlaymiz.
const keyOf = (subject, text) => `${subject}:${String(text).trim().toLowerCase().replace(/\s+/g, ' ')}`

function toEntry(item, meta) {
  const options = item.options || []
  const correctIndex = item.correctOption ?? item.answer
  const text = questionText(item)
  return {
    key: keyOf(meta.subject, text),
    question: text,
    options,
    selected: item.selectedOption == null ? null : options[item.selectedOption] ?? null,
    correct: item.back || options[correctIndex] || '',
    explanation: item.explanation || '',
    imageUrl: item.questionImageUrl || '',
    subject: meta.subject,
    grade: meta.grade,
    topic: item.topic || meta.title || '',
    missedAt: meta.date,
    missCount: 1,
  }
}

export const useMistakesStore = create(persist((set) => ({
  mistakes: [],
  // Test yakunlanganda chaqiriladi: xatolar qo'shiladi/yangilanadi, endi to'g'ri yechilganlari daftardan olib tashlanadi.
  recordTest: ({ testId, title, errors = [], questions = [] }) => set(state => {
    const meta = { subject: subjectOf(testId), grade: gradeOf(testId), title, date: Date.now() }
    const wrong = errors.map(item => toEntry(item, meta)).filter(entry => entry.question)
    const wrongKeys = new Set(wrong.map(entry => entry.key))
    const solvedKeys = new Set(questions.map(item => keyOf(meta.subject, questionText(item))).filter(key => !wrongKeys.has(key)))
    const byKey = new Map(state.mistakes.filter(entry => !solvedKeys.has(entry.key)).map(entry => [entry.key, entry]))
    wrong.forEach(entry => {
      const previous = byKey.get(entry.key)
      byKey.set(entry.key, previous ? { ...previous, ...entry, missCount: previous.missCount + 1 } : entry)
    })
    return { mistakes: [...byKey.values()].sort((a, b) => b.missedAt - a.missedAt) }
  }),
  removeMistake: key => set(state => ({ mistakes: state.mistakes.filter(entry => entry.key !== key) })),
  clearMistakes: () => set({ mistakes: [] }),
}), { name: 'ncp-mistakes' }))

// Imtihon komponentlari uchun: noto'g'ri javoblar o'quvchi tanlagan variant bilan birga.
export const wrongAnswers = (questions, answers) => questions.flatMap((question, index) => answers[index] === question.answer ? [] : [{ ...question, selectedOption: answers[index] }])

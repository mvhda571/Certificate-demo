import { buildCourse } from './buildCourse'
import quiz from './jahon-7/quiz.json'
import exams from './jahon-7/exams.json'
import flashcardsA from './jahon-7/flashcards-1.json'
import flashcardsB from './jahon-7/flashcards-2.json'

// 7-sinf "Jahon tarixi" (o'rta asrlar) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./jahon-7/*.md', { query: '?raw', import: 'default', eager: true })

export const worldHistory7Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 21 })

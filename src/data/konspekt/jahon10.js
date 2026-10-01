import { buildCourse } from './buildCourse'
import quiz from './jahon-10/quiz.json'
import exams from './jahon-10/exams.json'
import flashcardsA from './jahon-10/flashcards-1.json'
import flashcardsB from './jahon-10/flashcards-2.json'

// 10-sinf "Jahon tarixi" (1918–1991) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./jahon-10/*.md', { query: '?raw', import: 'default', eager: true })

export const worldHistory10Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 14 })

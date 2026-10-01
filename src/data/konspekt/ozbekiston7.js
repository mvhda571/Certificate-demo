import { buildCourse } from './buildCourse'
import quiz from './ozbekiston-7/quiz.json'
import exams from './ozbekiston-7/exams.json'
import flashcardsA from './ozbekiston-7/flashcards-1.json'
import flashcardsB from './ozbekiston-7/flashcards-2.json'

// 7-sinf "O‘zbekiston tarixi" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ozbekiston-7/*.md', { query: '?raw', import: 'default', eager: true })

export const uzbekHistory7Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 22 })

import { buildCourse } from './buildCourse'
import quiz from './ozbekiston-10/quiz.json'
import exams from './ozbekiston-10/exams.json'
import flashcardsA from './ozbekiston-10/flashcards-1.json'
import flashcardsB from './ozbekiston-10/flashcards-2.json'

// 10-sinf "O‘zbekiston tarixi" (1917–1991) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ozbekiston-10/*.md', { query: '?raw', import: 'default', eager: true })

export const uzbekHistory10Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 15 })

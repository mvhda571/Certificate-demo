import { buildCourse } from './buildCourse'
import quiz from './ozbekiston-11/quiz.json'
import exams from './ozbekiston-11/exams.json'
import flashcardsA from './ozbekiston-11/flashcards-1.json'
import flashcardsB from './ozbekiston-11/flashcards-2.json'

// 11-sinf "O‘zbekiston tarixi" (mustaqillik davri) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ozbekiston-11/*.md', { query: '?raw', import: 'default', eager: true })

export const uzbekHistory11Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 11 })

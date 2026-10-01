import { buildCourse } from './buildCourse'
import quiz from './ozbekiston-8/quiz.json'
import exams from './ozbekiston-8/exams.json'
import flashcardsA from './ozbekiston-8/flashcards-1.json'
import flashcardsB from './ozbekiston-8/flashcards-2.json'

// 8-sinf "O'zbekiston tarixi" (XV asr oxiri – XIX asr birinchi yarmi) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ozbekiston-8/*.md', { query: '?raw', import: 'default', eager: true })

export const uzbekHistory8Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 21 })

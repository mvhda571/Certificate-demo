import { buildCourse } from './buildCourse'
import quiz from './ozbekiston-9/quiz.json'
import exams from './ozbekiston-9/exams.json'
import flashcardsA from './ozbekiston-9/flashcards-1.json'
import flashcardsB from './ozbekiston-9/flashcards-2.json'

// 9-sinf "O'zbekiston tarixi" (XIX asr o'rtalari – XX asr boshlari) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ozbekiston-9/*.md', { query: '?raw', import: 'default', eager: true })

export const uzbekHistory9Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 19 })

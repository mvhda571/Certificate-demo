import { buildCourse } from './buildCourse'
import quiz from './jahon-9/quiz.json'
import exams from './jahon-9/exams.json'
import flashcardsA from './jahon-9/flashcards-1.json'
import flashcardsB from './jahon-9/flashcards-2.json'

// 9-sinf "Jahon tarixi" (XIX asr oxiri – XX asr boshi) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./jahon-9/*.md', { query: '?raw', import: 'default', eager: true })

export const worldHistory9Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 18 })

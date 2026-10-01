import { buildCourse } from './buildCourse'
import quiz from './jahon-8/quiz.json'
import exams from './jahon-8/exams.json'
import flashcardsA from './jahon-8/flashcards-1.json'
import flashcardsB from './jahon-8/flashcards-2.json'

// 8-sinf "Jahon tarixi" (Yangi davr, XV asr oxiri – 1870-yil) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./jahon-8/*.md', { query: '?raw', import: 'default', eager: true })

export const worldHistory8Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 19 })

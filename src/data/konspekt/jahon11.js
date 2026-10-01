import { buildCourse } from './buildCourse'
import quiz from './jahon-11/quiz.json'
import exams from './jahon-11/exams.json'
import flashcardsA from './jahon-11/flashcards-1.json'
import flashcardsB from './jahon-11/flashcards-2.json'

// 11-sinf "Jahon tarixi" (XX asr oxiri – XXI asr boshi) konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./jahon-11/*.md', { query: '?raw', import: 'default', eager: true })

export const worldHistory11Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 14 })

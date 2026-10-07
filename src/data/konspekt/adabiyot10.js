import { buildCourse } from './buildCourse'
import quiz from './adabiyot-10/quiz.json'
import exams from './adabiyot-10/exams.json'
import flashcardsA from './adabiyot-10/flashcards-1.json'
import flashcardsB from './adabiyot-10/flashcards-2.json'

// 10-sinf "Adabiyot" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./adabiyot-10/*.md', { query: '?raw', import: 'default', eager: true })

export const literature10Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 9 })

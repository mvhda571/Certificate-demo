import { buildCourse } from './buildCourse'
import quiz from './adabiyot-5/quiz.json'
import exams from './adabiyot-5/exams.json'
import flashcardsA from './adabiyot-5/flashcards-1.json'
import flashcardsB from './adabiyot-5/flashcards-2.json'

// 5-sinf "Adabiyot" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./adabiyot-5/*.md', { query: '?raw', import: 'default', eager: true })

export const literature5Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 13 })

import { buildCourse } from './buildCourse'
import quiz from './adabiyot-7/quiz.json'
import exams from './adabiyot-7/exams.json'
import flashcardsA from './adabiyot-7/flashcards-1.json'
import flashcardsB from './adabiyot-7/flashcards-2.json'

// 7-sinf "Adabiyot" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./adabiyot-7/*.md', { query: '?raw', import: 'default', eager: true })

export const literature7Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 14 })

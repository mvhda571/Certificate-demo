import { buildCourse } from './buildCourse'
import quiz from './adabiyot-11/quiz.json'
import exams from './adabiyot-11/exams.json'
import flashcardsA from './adabiyot-11/flashcards-1.json'
import flashcardsB from './adabiyot-11/flashcards-2.json'

// 11-sinf "Adabiyot" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./adabiyot-11/*.md', { query: '?raw', import: 'default', eager: true })

export const literature11Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 10 })

import { buildCourse } from './buildCourse'
import quiz from './adabiyot-9/quiz.json'
import exams from './adabiyot-9/exams.json'
import flashcardsA from './adabiyot-9/flashcards-1.json'
import flashcardsB from './adabiyot-9/flashcards-2.json'

// 9-sinf "Adabiyot" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./adabiyot-9/*.md', { query: '?raw', import: 'default', eager: true })

export const literature9Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 8 })

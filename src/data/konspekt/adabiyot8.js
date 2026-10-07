import { buildCourse } from './buildCourse'
import quiz from './adabiyot-8/quiz.json'
import exams from './adabiyot-8/exams.json'
import flashcardsA from './adabiyot-8/flashcards-1.json'
import flashcardsB from './adabiyot-8/flashcards-2.json'

// 8-sinf "Adabiyot" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./adabiyot-8/*.md', { query: '?raw', import: 'default', eager: true })

export const literature8Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 9 })

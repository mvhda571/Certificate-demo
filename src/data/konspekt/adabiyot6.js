import { buildCourse } from './buildCourse'
import quiz from './adabiyot-6/quiz.json'
import exams from './adabiyot-6/exams.json'
import flashcardsA from './adabiyot-6/flashcards-1.json'
import flashcardsB from './adabiyot-6/flashcards-2.json'

// 6-sinf "Adabiyot" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./adabiyot-6/*.md', { query: '?raw', import: 'default', eager: true })

export const literature6Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 11 })

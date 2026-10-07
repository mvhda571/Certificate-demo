import { buildCourse } from './buildCourse'
import quiz from './ona-tili-5/quiz.json'
import exams from './ona-tili-5/exams.json'

// 5-sinf "Ona tili" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ona-tili-5/*.md', { query: '?raw', import: 'default', eager: true })
const flashcards = Object.assign({}, ...Object.values(import.meta.glob('./ona-tili-5/flashcards-*.json', { import: 'default', eager: true })))

export const uzbekLanguage5Course = buildCourse({ files, quiz, exams, flashcards, midtermLastTopic: 43 })

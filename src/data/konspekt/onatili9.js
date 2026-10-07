import { buildCourse } from './buildCourse'
import quiz from './ona-tili-9/quiz.json'
import exams from './ona-tili-9/exams.json'

// 9-sinf "Ona tili" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ona-tili-9/*.md', { query: '?raw', import: 'default', eager: true })
const flashcards = Object.assign({}, ...Object.values(import.meta.glob('./ona-tili-9/flashcards-*.json', { import: 'default', eager: true })))

export const uzbekLanguage9Course = buildCourse({ files, quiz, exams, flashcards, midtermLastTopic: 29 })

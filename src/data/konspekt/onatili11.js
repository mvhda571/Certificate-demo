import { buildCourse } from './buildCourse'
import quiz from './ona-tili-11/quiz.json'
import exams from './ona-tili-11/exams.json'

// 11-sinf "Ona tili" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ona-tili-11/*.md', { query: '?raw', import: 'default', eager: true })
const flashcards = Object.assign({}, ...Object.values(import.meta.glob('./ona-tili-11/flashcards-*.json', { import: 'default', eager: true })))

export const uzbekLanguage11Course = buildCourse({ files, quiz, exams, flashcards, midtermLastTopic: 9 })

import { buildCourse } from './buildCourse'
import quiz from './ona-tili-7/quiz.json'
import exams from './ona-tili-7/exams.json'

// 7-sinf "Ona tili" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ona-tili-7/*.md', { query: '?raw', import: 'default', eager: true })
const flashcards = Object.assign({}, ...Object.values(import.meta.glob('./ona-tili-7/flashcards-*.json', { import: 'default', eager: true })))

export const uzbekLanguage7Course = buildCourse({ files, quiz, exams, flashcards, midtermLastTopic: 23 })

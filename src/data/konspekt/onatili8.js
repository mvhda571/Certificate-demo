import { buildCourse } from './buildCourse'
import quiz from './ona-tili-8/quiz.json'
import exams from './ona-tili-8/exams.json'

// 8-sinf "Ona tili" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ona-tili-8/*.md', { query: '?raw', import: 'default', eager: true })
const flashcards = Object.assign({}, ...Object.values(import.meta.glob('./ona-tili-8/flashcards-*.json', { import: 'default', eager: true })))

export const uzbekLanguage8Course = buildCourse({ files, quiz, exams, flashcards, midtermLastTopic: 27 })

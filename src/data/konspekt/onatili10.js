import { buildCourse } from './buildCourse'
import quiz from './ona-tili-10/quiz.json'
import exams from './ona-tili-10/exams.json'

// 10-sinf "Ona tili" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ona-tili-10/*.md', { query: '?raw', import: 'default', eager: true })
const flashcards = Object.assign({}, ...Object.values(import.meta.glob('./ona-tili-10/flashcards-*.json', { import: 'default', eager: true })))

export const uzbekLanguage10Course = buildCourse({ files, quiz, exams, flashcards, midtermLastTopic: 8 })

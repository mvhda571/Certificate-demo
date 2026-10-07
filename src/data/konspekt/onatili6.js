import { buildCourse } from './buildCourse'
import quiz from './ona-tili-6/quiz.json'
import exams from './ona-tili-6/exams.json'

// 6-sinf "Ona tili" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./ona-tili-6/*.md', { query: '?raw', import: 'default', eager: true })
const flashcards = Object.assign({}, ...Object.values(import.meta.glob('./ona-tili-6/flashcards-*.json', { import: 'default', eager: true })))

export const uzbekLanguage6Course = buildCourse({ files, quiz, exams, flashcards, midtermLastTopic: 57 })

import { buildCourse } from './buildCourse'
import quiz from './tarix-6/quiz.json'
import exams from './tarix-6/exams.json'
import flashcardsA from './tarix-6/flashcards-1.json'
import flashcardsB from './tarix-6/flashcards-2.json'

// 6-sinf "Qadimgi dunyo tarixi" konspektlari: har bir .md fayl bitta mavzu.
const files = import.meta.glob('./tarix-6/*.md', { query: '?raw', import: 'default', eager: true })

export const history6Course = buildCourse({ files, quiz, exams, flashcards: { ...flashcardsA, ...flashcardsB }, midtermLastTopic: 20 })

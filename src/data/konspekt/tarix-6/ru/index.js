// "История Древнего мира" (6 класс) — русский перевод конспектов, тестов и флеш-карточек.
import quiz from './quiz.json'
import exams from './exams.json'
import flashcards from './flashcards.json'

const files = import.meta.glob('./*.md', { query: '?raw', import: 'default', eager: true })

export default { files, quiz, exams, flashcards }

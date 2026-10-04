import { buildCourse } from './buildCourse'

// Har bir kurs tarjimasi alohida chunk bo'lib, faqat shu til tanlanganda yuklanadi.
// Tuzilma: `<dir>/ru/index.js` — `{ files, quiz, exams, flashcards }` ni eksport qiladi.
const loaders = import.meta.glob('./*/*/index.js')
const cache = new Map()

const loaderFor = (entry, lang) => (lang === 'uz' ? null : loaders[`./${entry.dir}/${lang}/index.js`])
export const hasTranslation = (entry, lang) => Boolean(entry && loaderFor(entry, lang))

// Tarjimasi hali yo'q mavzu, karta yoki test o'zbekcha qoladi — kurs tuzilishi va progress kalitlari o'zgarmaydi.
function merge(base, translated) {
  const byId = new Map(translated.topics.map(topic => [topic.id, topic]))
  const topics = base.topics.map(topic => {
    const other = byId.get(topic.id)
    if (!other?.sections.length) return topic
    return {
      ...topic, translated: true,
      title: other.title || topic.title, section: other.section || topic.section, sections: other.sections,
      flashcards: other.flashcards.length ? other.flashcards : topic.flashcards,
      quiz: other.quiz.length ? other.quiz : topic.quiz,
    }
  })
  const exam = kind => ({ ...translated[kind], questions: translated[kind].questions.length ? translated[kind].questions : base[kind].questions })
  return { topics, midterm: exam('midterm'), final: exam('final') }
}

export function loadKonspektCourse(entry, lang) {
  const loader = loaderFor(entry, lang)
  if (!loader) return Promise.resolve(entry.course)
  const key = `${entry.key}:${lang}`
  if (!cache.has(key)) {
    cache.set(key, loader().then(({ default: data }) => merge(entry.course, buildCourse({
      files: data.files, quiz: data.quiz || { topics: {} }, exams: data.exams || { midterm: [], final: [] }, flashcards: data.flashcards || {},
      midtermLastTopic: entry.course.midterm.lastTopic, lang,
    }))))
  }
  return cache.get(key)
}

import { history6Course } from './tarix6'
import { worldHistory7Course } from './jahon7'
import { uzbekHistory7Course } from './ozbekiston7'
import { worldHistory8Course } from './jahon8'
import { uzbekHistory8Course } from './ozbekiston8'
import { uzbekHistory9Course } from './ozbekiston9'
import { worldHistory9Course } from './jahon9'
import { uzbekHistory10Course } from './ozbekiston10'
import { uzbekHistory11Course } from './ozbekiston11'
import { worldHistory10Course } from './jahon10'
import { worldHistory11Course } from './jahon11'

// Konspekt asosidagi tarix kurslari. `key` — progress saqlanadigan kalit (useLearningStore).
// `period` berilsa, dastur sarlavhasi va mavzular ro'yxati kursning o'zidan olinadi.
// `dir` — konspekt papkasi (tarjimalar `<dir>/ru/` ichida), `ru` — sarlavhalarning ruscha varianti.
export const konspektCourses = {
  'tarix-6': { key: 'tarix-6', dir: 'tarix-6', grade: '6', title: 'Qadimgi dunyo tarixi', period: 'Qadimgi dunyo tarixi', pdf: '/textbooks/tarix-6.pdf', course: history6Course,
    ru: { title: 'История Древнего мира', period: 'История Древнего мира' } },
  // 'tarix-7' kaliti eski darslik darslari bilan bir xil — mavzular tartibi mos, progress saqlanadi.
  'tarix-7': { key: 'tarix-7', dir: 'ozbekiston-7', grade: '7', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'IV–XV asrlarda O‘zbekiston tarixi', pdf: '/textbooks/tarix-7.pdf', course: uzbekHistory7Course,
    ru: { title: 'История Узбекистана', period: 'История Узбекистана IV–XV веков' } },
  'tarix-7-jahon': { key: 'tarix-7-jahon', dir: 'jahon-7', grade: '7', track: 'jahon', title: 'Jahon tarixi', period: 'O‘rta asrlar tarixi (V–XV asrlar)', course: worldHistory7Course,
    ru: { title: 'Всемирная история', period: 'История Средних веков (V–XV века)' } },
  'tarix-8': { key: 'tarix-8', dir: 'ozbekiston-8', grade: '8', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'XV asr oxiri – XIX asr birinchi yarmida O‘zbekiston tarixi', pdf: '/textbooks/tarix-8.pdf', course: uzbekHistory8Course,
    ru: { title: 'История Узбекистана', period: 'История Узбекистана конца XV – первой половины XIX века' } },
  'tarix-8-jahon': { key: 'tarix-8-jahon', dir: 'jahon-8', grade: '8', track: 'jahon', title: 'Jahon tarixi', period: 'Yangi davr tarixi (XV asr oxiri – 1870-yil)', course: worldHistory8Course,
    ru: { title: 'Всемирная история', period: 'История Нового времени (конец XV века – 1870 год)' } },
  'tarix-9': { key: 'tarix-9', dir: 'ozbekiston-9', grade: '9', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'XIX asr o‘rtalari – XX asr boshlarida O‘zbekiston tarixi', pdf: '/textbooks/tarix-9.pdf', course: uzbekHistory9Course,
    ru: { title: 'История Узбекистана', period: 'История Узбекистана середины XIX – начала XX века' } },
  'tarix-9-jahon': { key: 'tarix-9-jahon', dir: 'jahon-9', grade: '9', track: 'jahon', title: 'Jahon tarixi', period: 'Eng yangi davr boshlari (XIX asr oxiri – XX asr boshi)', course: worldHistory9Course,
    ru: { title: 'Всемирная история', period: 'Начало Новейшего времени (конец XIX – начало XX века)' } },
  'tarix-10': { key: 'tarix-10', dir: 'ozbekiston-10', grade: '10', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'O‘zbekiston tarixi (1917–1991-yillar)', pdf: '/textbooks/tarix-10.pdf', course: uzbekHistory10Course,
    ru: { title: 'История Узбекистана', period: 'История Узбекистана (1917–1991 годы)' } },
  'tarix-10-jahon': { key: 'tarix-10-jahon', dir: 'jahon-10', grade: '10', track: 'jahon', title: 'Jahon tarixi', period: 'Eng yangi davr tarixi (1918–1991-yillar)', course: worldHistory10Course,
    ru: { title: 'Всемирная история', period: 'Новейшая история (1918–1991 годы)' } },
  'tarix-11': { key: 'tarix-11', dir: 'ozbekiston-11', grade: '11', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'Mustaqil O‘zbekiston tarixi (1991-yildan)', pdf: '/textbooks/tarix-11.pdf', course: uzbekHistory11Course,
    ru: { title: 'История Узбекистана', period: 'История независимого Узбекистана (с 1991 года)' } },
  'tarix-11-jahon': { key: 'tarix-11-jahon', dir: 'jahon-11', grade: '11', track: 'jahon', title: 'Jahon tarixi', period: 'XX asr oxiri – XXI asr boshlarida jahon tarixi', course: worldHistory11Course,
    ru: { title: 'Всемирная история', period: 'Всемирная история конца XX – начала XXI века' } },
}

// Bir nechta yo'nalishga ega sinflar: sinf bosilganda avval yo'nalish tanlanadi.
export const historyTracks = {
  7: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'IV–XV asrlarda O‘zbekiston tarixi: 42 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'История Узбекистана', description: 'История Узбекистана IV–XV веков: 42 конспекта, флеш-карточки, промежуточный и итоговый тест.' } },
    { id: 'jahon', title: 'Jahon tarixi', description: 'O‘rta asrlar jahon tarixi: 44 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'Всемирная история', description: 'Всемирная история Средних веков: 44 конспекта, флеш-карточки, промежуточный и итоговый тест.' } },
  ],
  8: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'XV asr oxiri – XIX asr birinchi yarmida O‘zbekiston tarixi: 40 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'История Узбекистана', description: 'История Узбекистана конца XV – первой половины XIX века: 40 конспектов, флеш-карточки, промежуточный и итоговый тест.' } },
    { id: 'jahon', title: 'Jahon tarixi', description: 'Yangi davr jahon tarixi (XV asr oxiri – 1870-yil): 32 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'Всемирная история', description: 'Всемирная история Нового времени (конец XV века – 1870 год): 32 конспекта, флеш-карточки, промежуточный и итоговый тест.' } },
  ],
  9: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'XIX asr o‘rtalari – XX asr boshlarida O‘zbekiston tarixi: 39 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'История Узбекистана', description: 'История Узбекистана середины XIX – начала XX века: 39 конспектов, флеш-карточки, промежуточный и итоговый тест.' } },
    { id: 'jahon', title: 'Jahon tarixi', description: 'XIX asr oxiri – XX asr boshi jahon tarixi: 41 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'Всемирная история', description: 'Всемирная история конца XIX – начала XX века: 41 конспект, флеш-карточки, промежуточный и итоговый тест.' } },
  ],
  10: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: '1917–1991-yillarda O‘zbekiston tarixi: 28 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'История Узбекистана', description: 'История Узбекистана в 1917–1991 годах: 28 конспектов, флеш-карточки, промежуточный и итоговый тест.' } },
    { id: 'jahon', title: 'Jahon tarixi', description: '1918–1991-yillarda jahon tarixi: 26 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'Всемирная история', description: 'Всемирная история 1918–1991 годов: 26 конспектов, флеш-карточки, промежуточный и итоговый тест.' } },
  ],
  11: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'Mustaqil O‘zbekiston tarixi: 22 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'История Узбекистана', description: 'История независимого Узбекистана: 22 конспекта, флеш-карточки, промежуточный и итоговый тест.' } },
    { id: 'jahon', title: 'Jahon tarixi', description: 'XX asr oxiri – XXI asr boshlarida jahon tarixi: 29 ta konspekt, flashcardlar, oraliq va yakuniy test.',
      ru: { title: 'Всемирная история', description: 'Всемирная история конца XX – начала XXI века: 29 конспектов, флеш-карточки, промежуточный и итоговый тест.' } },
  ],
}

// Sarlavha va tavsiflarning joriy tildagi varianti (tarjima bo'lmasa — o'zbekcha).
export const localize = (item, lang) => (item && lang !== 'uz' && item[lang] ? { ...item, ...item[lang] } : item)

export const TOPIC_TEST_SIZE = 15
export const TEST_DURATION_SECONDS = 20 * 60

export function findKonspektCourse(grade, track) {
  return Object.values(konspektCourses).find(entry => entry.grade === String(grade) && (entry.track || null) === (track || null)) || null
}

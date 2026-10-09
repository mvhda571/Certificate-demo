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
import { literature5Course } from './adabiyot5'
import { literature6Course } from './adabiyot6'
import { literature7Course } from './adabiyot7'
import { literature8Course } from './adabiyot8'
import { literature9Course } from './adabiyot9'
import { literature10Course } from './adabiyot10'
import { literature11Course } from './adabiyot11'
import { uzbekLanguage5Course } from './onatili5'
import { uzbekLanguage6Course } from './onatili6'
import { uzbekLanguage7Course } from './onatili7'
import { uzbekLanguage8Course } from './onatili8'
import { uzbekLanguage9Course } from './onatili9'
import { uzbekLanguage10Course } from './onatili10'
import { uzbekLanguage11Course } from './onatili11'

// Konspekt asosidagi kurslar. `key` — progress saqlanadigan kalit (useLearningStore).
// `subject` berilmasa — tarix kursi.
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
  'adabiyot-5': { key: 'adabiyot-5', dir: 'adabiyot-5', grade: '5', subject: 'adabiyot', title: 'Adabiyot', period: 'Adabiyot – so‘z san’ati', course: literature5Course,
    ru: { title: 'Литература', period: 'Литература – искусство слова' } },
  // Eski 6-sinf darslik darslari 'adabiyot-6' kalitida — konspekt progressi ular bilan aralashmasligi uchun alohida kalit.
  'adabiyot-6': { key: 'adabiyot-6-konspekt', dir: 'adabiyot-6', grade: '6', subject: 'adabiyot', title: 'Adabiyot', period: 'Adabiyot – ma’naviyat xazinasi', course: literature6Course,
    ru: { title: 'Литература', period: 'Литература – сокровищница духовности' } },
  'adabiyot-7': { key: 'adabiyot-7-konspekt', dir: 'adabiyot-7', grade: '7', subject: 'adabiyot', title: 'Adabiyot', period: 'Adabiyot – badiiy so‘z qudrati', course: literature7Course,
    ru: { title: 'Литература', period: 'Литература – сила художественного слова' } },
  'adabiyot-8': { key: 'adabiyot-8-konspekt', dir: 'adabiyot-8', grade: '8', subject: 'adabiyot', title: 'Adabiyot', period: 'Adabiyot – xalq ruhining ko‘zgusi', course: literature8Course,
    ru: { title: 'Литература', period: 'Литература – зеркало души народа' } },
  // Eski 9-sinf darslik darslari 'adabiyot-9' kalitida — konspekt progressi alohida.
  'adabiyot-9': { key: 'adabiyot-9-konspekt', dir: 'adabiyot-9', grade: '9', subject: 'adabiyot', title: 'Adabiyot', period: 'Adabiyot – ruhiy kamolot vositasi', course: literature9Course,
    ru: { title: 'Литература', period: 'Литература – средство духовного совершенства' } },
  // Eski 10-sinf darslik darslari 'adabiyot-10' kalitida — konspekt progressi alohida.
  'adabiyot-10': { key: 'adabiyot-10-konspekt', dir: 'adabiyot-10', grade: '10', subject: 'adabiyot', title: 'Adabiyot', period: 'Adabiyot – ma’naviyatni yuksaltirish vositasi', course: literature10Course,
    ru: { title: 'Литература', period: 'Литература – средство духовного возвышения' } },
  // Eski 11-sinf darslik darslari 'adabiyot-11' kalitida — konspekt progressi alohida.
  'adabiyot-11': { key: 'adabiyot-11-konspekt', dir: 'adabiyot-11', grade: '11', subject: 'adabiyot', title: 'Adabiyot', period: 'Adabiyot – qadimdan bugungacha', course: literature11Course,
    ru: { title: 'Литература', period: 'Литература – от древности до наших дней' } },
  'ona-tili-5': { key: 'ona-tili-5-konspekt', dir: 'ona-tili-5', grade: '5', subject: 'ona-tili', title: 'Ona tili', period: 'Fonetika, imlo, leksikologiya va punktuatsiya', course: uzbekLanguage5Course,
    ru: { title: 'Родной язык', period: 'Фонетика, орфография, лексикология и пунктуация' } },
  // Eski 6-sinf ona tili darslari 'ona-tili-6' kalitida — konspekt progressi alohida.
  'ona-tili-6': { key: 'ona-tili-6-konspekt', dir: 'ona-tili-6', grade: '6', subject: 'ona-tili', title: 'Ona tili', period: 'Matn, so‘z tarkibi va mustaqil so‘z turkumlari', course: uzbekLanguage6Course,
    ru: { title: 'Родной язык', period: 'Текст, состав слова и самостоятельные части речи' } },
  'ona-tili-7': { key: 'ona-tili-7-konspekt', dir: 'ona-tili-7', grade: '7', subject: 'ona-tili', title: 'Ona tili', period: 'Olmosh, kelishiklar va yordamchi so‘zlar', course: uzbekLanguage7Course,
    ru: { title: 'Родной язык', period: 'Местоимение, падежи и служебные слова' } },
  'ona-tili-8': { key: 'ona-tili-8-konspekt', dir: 'ona-tili-8', grade: '8', subject: 'ona-tili', title: 'Ona tili', period: 'Sintaksis: so‘z birikmasi va sodda gap', course: uzbekLanguage8Course,
    ru: { title: 'Родной язык', period: 'Синтаксис: словосочетание и простое предложение' } },
  'ona-tili-9': { key: 'ona-tili-9-konspekt', dir: 'ona-tili-9', grade: '9', subject: 'ona-tili', title: 'Ona tili', period: 'Qo‘shma gap, ko‘chirma gap va nutq uslublari', course: uzbekLanguage9Course,
    ru: { title: 'Родной язык', period: 'Сложное предложение, прямая речь и стили речи' } },
  'ona-tili-10': { key: 'ona-tili-10-konspekt', dir: 'ona-tili-10', grade: '10', subject: 'ona-tili', title: 'Ona tili', period: 'Nutq uslublari va so‘z uslubiyati (2-qism)', course: uzbekLanguage10Course,
    ru: { title: 'Родной язык', period: 'Стили речи и стилистика слова (2-я часть)' } },
  'ona-tili-11': { key: 'ona-tili-11-konspekt', dir: 'ona-tili-11', grade: '11', subject: 'ona-tili', title: 'Ona tili', period: 'Nutq madaniyati me’yorlari (2-qism)', course: uzbekLanguage11Course,
    ru: { title: 'Родной язык', period: 'Нормы культуры речи (2-я часть)' } },
}

export const courseSubject = entry => entry.subject || 'tarix'

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

export function findKonspektCourse(grade, track, subject = 'tarix') {
  return Object.values(konspektCourses).find(entry => courseSubject(entry) === subject && entry.grade === String(grade) && (entry.track || null) === (track || null)) || null
}

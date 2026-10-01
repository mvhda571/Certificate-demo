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
export const konspektCourses = {
  'tarix-6': { key: 'tarix-6', grade: '6', title: 'Qadimgi dunyo tarixi', course: history6Course },
  // 'tarix-7' kaliti eski darslik darslari bilan bir xil — mavzular tartibi mos, progress saqlanadi.
  'tarix-7': { key: 'tarix-7', grade: '7', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'IV–XV asrlarda O‘zbekiston tarixi', pdf: '/textbooks/tarix-7.pdf', course: uzbekHistory7Course },
  'tarix-7-jahon': { key: 'tarix-7-jahon', grade: '7', track: 'jahon', title: 'Jahon tarixi', period: 'O‘rta asrlar tarixi (V–XV asrlar)', course: worldHistory7Course },
  'tarix-8': { key: 'tarix-8', grade: '8', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'XV asr oxiri – XIX asr birinchi yarmida O‘zbekiston tarixi', pdf: '/textbooks/tarix-8.pdf', course: uzbekHistory8Course },
  'tarix-8-jahon': { key: 'tarix-8-jahon', grade: '8', track: 'jahon', title: 'Jahon tarixi', period: 'Yangi davr tarixi (XV asr oxiri – 1870-yil)', course: worldHistory8Course },
  'tarix-9': { key: 'tarix-9', grade: '9', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'XIX asr o‘rtalari – XX asr boshlarida O‘zbekiston tarixi', pdf: '/textbooks/tarix-9.pdf', course: uzbekHistory9Course },
  'tarix-9-jahon': { key: 'tarix-9-jahon', grade: '9', track: 'jahon', title: 'Jahon tarixi', period: 'Eng yangi davr boshlari (XIX asr oxiri – XX asr boshi)', course: worldHistory9Course },
  'tarix-10': { key: 'tarix-10', grade: '10', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'O‘zbekiston tarixi (1917–1991-yillar)', pdf: '/textbooks/tarix-10.pdf', course: uzbekHistory10Course },
  'tarix-10-jahon': { key: 'tarix-10-jahon', grade: '10', track: 'jahon', title: 'Jahon tarixi', period: 'Eng yangi davr tarixi (1918–1991-yillar)', course: worldHistory10Course },
  'tarix-11': { key: 'tarix-11', grade: '11', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'Mustaqil O‘zbekiston tarixi (1991-yildan)', pdf: '/textbooks/tarix-11.pdf', course: uzbekHistory11Course },
  'tarix-11-jahon': { key: 'tarix-11-jahon', grade: '11', track: 'jahon', title: 'Jahon tarixi', period: 'XX asr oxiri – XXI asr boshlarida jahon tarixi', course: worldHistory11Course },
}

// Bir nechta yo'nalishga ega sinflar: sinf bosilganda avval yo'nalish tanlanadi.
export const historyTracks = {
  7: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'IV–XV asrlarda O‘zbekiston tarixi: 42 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
    { id: 'jahon', title: 'Jahon tarixi', description: 'O‘rta asrlar jahon tarixi: 44 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
  ],
  8: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'XV asr oxiri – XIX asr birinchi yarmida O‘zbekiston tarixi: 40 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
    { id: 'jahon', title: 'Jahon tarixi', description: 'Yangi davr jahon tarixi (XV asr oxiri – 1870-yil): 32 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
  ],
  9: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'XIX asr o‘rtalari – XX asr boshlarida O‘zbekiston tarixi: 39 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
    { id: 'jahon', title: 'Jahon tarixi', description: 'XIX asr oxiri – XX asr boshi jahon tarixi: 41 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
  ],
  10: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: '1917–1991-yillarda O‘zbekiston tarixi: 28 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
    { id: 'jahon', title: 'Jahon tarixi', description: '1918–1991-yillarda jahon tarixi: 26 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
  ],
  11: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'Mustaqil O‘zbekiston tarixi: 22 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
    { id: 'jahon', title: 'Jahon tarixi', description: 'XX asr oxiri – XXI asr boshlarida jahon tarixi: 29 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
  ],
}

export const TOPIC_TEST_SIZE = 15
export const TEST_DURATION_SECONDS = 20 * 60

export function findKonspektCourse(grade, track) {
  return Object.values(konspektCourses).find(entry => entry.grade === String(grade) && (entry.track || null) === (track || null)) || null
}

import { history6Course } from './tarix6'
import { worldHistory7Course } from './jahon7'
import { uzbekHistory7Course } from './ozbekiston7'

// Konspekt asosidagi tarix kurslari. `key` — progress saqlanadigan kalit (useLearningStore).
// `period` berilsa, dastur sarlavhasi va mavzular ro'yxati kursning o'zidan olinadi.
export const konspektCourses = {
  'tarix-6': { key: 'tarix-6', grade: '6', title: 'Qadimgi dunyo tarixi', course: history6Course },
  // 'tarix-7' kaliti eski darslik darslari bilan bir xil — mavzular tartibi mos, progress saqlanadi.
  'tarix-7': { key: 'tarix-7', grade: '7', track: 'ozbekiston', title: 'O‘zbekiston tarixi', period: 'IV–XV asrlarda O‘zbekiston tarixi', pdf: '/textbooks/tarix-7.pdf', course: uzbekHistory7Course },
  'tarix-7-jahon': { key: 'tarix-7-jahon', grade: '7', track: 'jahon', title: 'Jahon tarixi', period: 'O‘rta asrlar tarixi (V–XV asrlar)', course: worldHistory7Course },
}

// Bir nechta yo'nalishga ega sinflar: sinf bosilganda avval yo'nalish tanlanadi.
export const historyTracks = {
  7: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'IV–XV asrlarda O‘zbekiston tarixi: 42 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
    { id: 'jahon', title: 'Jahon tarixi', description: 'O‘rta asrlar jahon tarixi: 44 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
  ],
}

export const TOPIC_TEST_SIZE = 15
export const TEST_DURATION_SECONDS = 20 * 60

export function findKonspektCourse(grade, track) {
  return Object.values(konspektCourses).find(entry => entry.grade === String(grade) && (entry.track || null) === (track || null)) || null
}

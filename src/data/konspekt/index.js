import { history6Course } from './tarix6'
import { worldHistory7Course } from './jahon7'

// Konspekt asosidagi tarix kurslari. `key` — progress saqlanadigan kalit (useLearningStore).
export const konspektCourses = {
  'tarix-6': { key: 'tarix-6', grade: '6', title: 'Qadimgi dunyo tarixi', course: history6Course },
  'tarix-7-jahon': { key: 'tarix-7-jahon', grade: '7', track: 'jahon', title: 'Jahon tarixi', period: 'O‘rta asrlar tarixi (V–XV asrlar)', course: worldHistory7Course },
}

// Bir nechta yo'nalishga ega sinflar: sinf bosilganda avval yo'nalish tanlanadi.
export const historyTracks = {
  7: [
    { id: 'ozbekiston', title: 'O‘zbekiston tarixi', description: 'IV–XVI asrlarda O‘zbekiston tarixi: darslik mavzulari, progress testlar va Mock Exam.' },
    { id: 'jahon', title: 'Jahon tarixi', description: 'O‘rta asrlar jahon tarixi: 44 ta konspekt, flashcardlar, oraliq va yakuniy test.' },
  ],
}

export function findKonspektCourse(grade, track) {
  return Object.values(konspektCourses).find(entry => entry.grade === String(grade) && (entry.track || null) === (track || null)) || null
}

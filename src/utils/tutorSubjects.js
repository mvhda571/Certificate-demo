export const TUTOR_SUBJECTS = [
  ['general', '💬'],
  ['ielts', '🎧'],
  ['sat', '🎯'],
  ['mathematics', '📐'],
  ['language', '✍️'],
  ['literature', '📚'],
  ['history', '🏛️'],
  ['english', '🗣️'],
]

export const subjectEmoji = (subject) => TUTOR_SUBJECTS.find(([id]) => id === subject)?.[1] || '💬'

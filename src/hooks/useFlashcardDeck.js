import { useMemo } from 'react'
import { useAcademyStore } from '../store/academyStore'
import { useLearningStore } from '../store/useLearningStore'
import { useTestStore } from '../store/useTestStore'
import { curriculum } from '../data/curriculum'
import { historyGrades } from '../data/historyCurriculum'
import math from '../data/mathCurriculum.json'
import uzbek from '../data/uzbekCurriculum.json'
import literature from '../data/literatureCurriculum.json'
import { konspektCourses } from '../data/konspekt'

// Konspekt kursi bilan almashtirilgan sinflar (eski fakt-kartalari endi ishlatilmaydi).
const konspektGrades = new Set(Object.values(konspektCourses).filter(entry => entry.key === `tarix-${entry.grade}`).map(entry => entry.grade))

const factsOf = lesson => lesson.facts || lesson.formulas || lesson.points || lesson.rules || []

function curriculumCards(completed) {
  const cards = []
  Object.entries(curriculum).forEach(([subject, lessons]) => lessons.forEach(lesson => { if (completed[`${subject}:${lesson.id}`]) factsOf(lesson).slice(0, 2).forEach((fact, index) => cards.push({ id: `${subject}-${lesson.id}-${index}`, subject, front: lesson.title, back: fact, source: 'Dars mavzusi' })) }))
  // Mavzu kartalari faqat o'quvchi shu mavzuni yakunlagandan keyin qo'shiladi.
  Object.values(konspektCourses).forEach(({ key, grade, title, course }) => course.topics.forEach(topic => { if (completed[`${key}:${topic.id}`]) topic.flashcards.forEach((card, index) => cards.push({ id: `${key}-konspekt-${topic.id}-${index}`, subject: `${title} ${grade} · ${topic.id}-mavzu`, front: card.front, back: card.back, source: topic.title })) }))
  Object.entries(historyGrades).forEach(([grade, data]) => !konspektGrades.has(grade) && data.lessons.forEach(lesson => { if (completed[`tarix-${grade}:${lesson.id}`]) factsOf(lesson).slice(0, 2).forEach((fact, index) => cards.push({ id: `tarix-${grade}-${lesson.id}-${index}`, subject: `Tarix ${grade}`, front: lesson.title, back: fact, source: 'PDF mavzusi' })) }))
  ;[[math, 'matematika'], [uzbek, 'ona-tili'], [literature, 'adabiyot']].forEach(([grades, subject]) => Object.entries(grades).forEach(([grade, data]) => (data.lessons || []).forEach(lesson => { if (completed[`${subject}-${grade}:${lesson.id}`]) factsOf(lesson).slice(0, 2).forEach((fact, index) => cards.push({ id: `${subject}-${grade}-${lesson.id}-${index}`, subject: `${subject} ${grade}`, front: lesson.title, back: fact, source: 'PDF mavzusi' })) })))
  return cards
}

const DAY_MS = 24 * 60 * 60 * 1000

// Karta hali ko'rib chiqilmagan bo'lsa (schedule yo'q) — darhol navbatda.
// Ko'rib chiqilgan bo'lsa — faqat rejalashtirilgan sana (dueAt) kelganda qaytadi.
export const isCardDue = (schedule, now = Date.now()) => !schedule || schedule.dueAt <= now

// Hammasi hozircha "due" bo'lmasa, eng yaqin karta necha kundan keyin
// qaytishini hisoblaydi (sidebar/empty-state hintlari uchun).
export const daysUntilNextDue = (cards, schedule, now = Date.now()) => {
  const future = cards.map(card => schedule[card.id]?.dueAt).filter(time => time > now)
  if (!future.length) return null
  return Math.max(1, Math.ceil((Math.min(...future) - now) / DAY_MS))
}

/**
 * Butun ilova bo'ylab bitta manba: foydalanuvchining barcha flesh-kartalari
 * (dars/konspekt faktlari + test xatolari) va ularning takrorlash jadvali.
 * FlashcardsPage to'liq to'plamni ko'rsatish uchun, Sidebar esa faqat
 * "bugun nechta karta takrorlash kerak" belgisini chiqarish uchun ishlatadi.
 */
export function useFlashcardDeck() {
  const completed = useLearningStore(state => state.completed)
  const errorLog = useTestStore(state => state.errorLog)
  const cardSchedule = useAcademyStore(state => state.cardSchedule)

  const allCards = useMemo(() => {
    const mistakes = errorLog.map((item, i) => ({ id: `mistake-${item.id || i}`, subject: item.topic || 'Test xatosi', front: item.front || item.text, back: item.back || item.explanation || item.options?.[item.answer] || 'To‘g‘ri javobni qayta tekshiring.', source: 'Takrorlash uchun' }))
    const unique = new Map([...mistakes, ...curriculumCards(completed)].map(card => [card.id, card]))
    return [...unique.values()]
  }, [completed, errorLog])

  const dueCards = useMemo(() => allCards.filter(card => isCardDue(cardSchedule[card.id])), [allCards, cardSchedule])
  const nextDueInDays = useMemo(() => daysUntilNextDue(allCards, cardSchedule), [allCards, cardSchedule])

  return { allCards, cardSchedule, dueCards, nextDueInDays }
}

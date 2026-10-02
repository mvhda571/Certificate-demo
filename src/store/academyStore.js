import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from './useUserStore'
import { notifyTestReward } from '../utils/rewardNotifications'

const DAY_MS = 24 * 60 * 60 * 1000
// "Bilaman" deb ketma-ket belgilangan safar soni ortgani sayin, keyingi ko'rish
// orasidagi tanaffus ham o'sib boradi (oddiylashtirilgan SM-2 uslubi).
const REVIEW_INTERVALS_DAYS = [1, 3, 7, 16, 35]

export const useAcademyStore = create(
  persist(
    (set) => ({
      flashcardStatus: {},
      // cardSchedule[id] = { reps, dueAt } — karta keyingi safar qachon
      // "takrorlash kerak" ro'yxatiga qaytishini belgilaydi.
      cardSchedule: {},
      dailyQuests: { questions: false, flashcards: false, lesson: false },
      soundEnabled: true,
      streak: 0,
      completedTests: [],
      errorBank: [],
      setFlashcardStatus: (id, status) => set((state) => {
        const previous = state.cardSchedule[id]
        const reps = status === 'known' ? (previous?.reps || 0) + 1 : 0
        const intervalDays = status === 'known' ? REVIEW_INTERVALS_DAYS[Math.min(reps - 1, REVIEW_INTERVALS_DAYS.length - 1)] : 0
        const dueAt = Date.now() + intervalDays * DAY_MS
        return {
          flashcardStatus: { ...state.flashcardStatus, [id]: status },
          cardSchedule: { ...state.cardSchedule, [id]: { reps, intervalDays, dueAt } },
        }
      }),
      toggleQuest: (id) => set((state) => ({ dailyQuests: { ...state.dailyQuests, [id]: !state.dailyQuests[id] } })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      saveTest: (result) => set((state) => {
        const xpEarned = Math.round((Math.max(0, result.score) / Math.max(1, result.total || 40)) * 1000)
        const percent = Math.round((Math.max(0, result.score) / Math.max(1, result.total || 40)) * 100)
        useUserStore.getState().addPoints(xpEarned)
        notifyTestReward(percent, xpEarned)
        return ({
        completedTests: [{ ...result, xpEarned }, ...state.completedTests].slice(0, 10),
        errorBank: result.errors,
      })}),
    }),
    { name: 'certificate-academy' },
  ),
)

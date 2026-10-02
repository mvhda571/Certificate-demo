import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Foydalanuvchining mahalliy kalendar sanasi (UTC emas) — aks holda UTC+5 kabi
// zonalarda yarim tunga yaqin sana chegarasi noto'g'ri hisoblanadi.
const dateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const useStreakStore = create(persist((set) => ({
  streak: 0, lastStudyDate: null, dailyChallengeDone: false,
  markStudyDay: () => set((state) => {
    const today = dateKey(new Date())
    if (state.lastStudyDate === today) return state
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const continued = state.lastStudyDate === dateKey(yesterday)
    return { streak: continued ? state.streak + 1 : 1, lastStudyDate: today }
  }),
  completeChallenge: () => set({ dailyChallengeDone: true }),
}), {
  name: 'ncp-streak',
  version: 2,
  migrate: (state, version) => version < 2 ? { ...state, streak: 0, lastStudyDate: null } : state,
}))

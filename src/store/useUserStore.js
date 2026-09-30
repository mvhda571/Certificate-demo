import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const USER_ID_REGISTRY = 'certificate-user-ids'

function getOrCreateUserId(identity) {
  const key = String(identity || 'guest').trim().toLowerCase()
  const registry = JSON.parse(localStorage.getItem(USER_ID_REGISTRY) || '{}')
  if (registry[key]) return registry[key]
  const used = new Set(Object.values(registry))
  let userId
  do {
    const sixDigits = crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0
    const min = sixDigits ? 100000 : 10000
    const range = sixDigits ? 900000 : 90000
    userId = String(min + crypto.getRandomValues(new Uint32Array(1))[0] % range)
  } while (used.has(userId))
  registry[key] = userId
  localStorage.setItem(USER_ID_REGISTRY, JSON.stringify(registry))
  return userId
}

export const useUserStore = create(persist((set) => ({
  isAuthenticated: false,
  profile: { name: '', email: '', displayName: '', photoURL: '', googleId: '', userId: '', authProvider: 'local', grade: '', targetGrade: 'A', telegram: '' },
  points: 0,
  notifications: true,
  updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
  login: ({ name, email, ...details }) => set((state) => ({
    isAuthenticated: true,
    profile: { ...state.profile, ...details, name: name || email.split('@')[0], displayName: name || email.split('@')[0], email, userId: getOrCreateUserId(email), authProvider: 'local' },
  })),
  loginWithGoogle: ({ email, displayName, photoURL, googleId }) => set((state) => ({
    isAuthenticated: true,
    profile: { ...state.profile, name: displayName, displayName, email, photoURL, googleId, userId: getOrCreateUserId(googleId || email), authProvider: 'google' },
  })),
  logout: () => set({ isAuthenticated: false, profile: { name: '', email: '', displayName: '', photoURL: '', googleId: '', userId: '', authProvider: 'local', grade: '', targetGrade: 'A', telegram: '' }, points: 0 }),
  addPoints: (points) => set((state) => ({ points: state.points + points })),
  toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
}), {
  name: 'ncp-user',
  version: 4,
  migrate: (state, version) => ({
    ...state,
    points: version < 2 ? 0 : state.points,
    profile: { displayName: state.profile?.name || '', photoURL: '', googleId: '', userId: state.profile?.userId || (state.isAuthenticated ? getOrCreateUserId(state.profile?.googleId || state.profile?.email) : ''), authProvider: 'local', ...state.profile },
  }),
}))

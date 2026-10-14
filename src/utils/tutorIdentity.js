import { useUserStore } from '../store/useUserStore'

const DEVICE_KEY = 'certificate-tutor-device'

// Brauzerga bog'liq tasodifiy id (Google bilan kirilmagan bo'lsa, server IP bilan birga ishlatadi).
function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return 'no-storage'
  }
}

// /api/tutor uchun o'quvchini aniqlovchi sarlavhalar.
export function tutorAuthHeaders() {
  const credential = useUserStore.getState().googleCredential
  return {
    'X-Tutor-Device': deviceId(),
    ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
  }
}

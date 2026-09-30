const ACCOUNTS_KEY = 'certificate-accounts'

// Demo-only storage: accounts live in this browser until a real backend exists.
function readAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}') } catch { return {} }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

export async function hashPassword(email, password) {
  const bytes = new TextEncoder().encode(`${normalizeEmail(email)}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function registerAccount({ firstName, lastName, email, password }) {
  const key = normalizeEmail(email)
  const accounts = readAccounts()
  if (accounts[key]) return { error: 'errExists' }
  accounts[key] = { firstName: firstName.trim(), lastName: lastName.trim(), email: key, passwordHash: await hashPassword(key, password), onboarded: false }
  writeAccounts(accounts)
  return { account: accounts[key] }
}

export async function verifyAccount({ email, password }) {
  const key = normalizeEmail(email)
  const account = readAccounts()[key]
  if (!account) return { error: 'errNotFound' }
  if (account.passwordHash !== await hashPassword(key, password)) return { error: 'errWrongPassword' }
  return { account }
}

export function saveOnboarding(email, answers) {
  const key = normalizeEmail(email)
  const accounts = readAccounts()
  if (!accounts[key]) return
  accounts[key] = { ...accounts[key], ...answers, onboarded: true }
  writeAccounts(accounts)
  return accounts[key]
}

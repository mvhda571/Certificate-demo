// AI javobini ovozli o'qish (Web Speech API, speechSynthesis).

// Formulalar, kod, havolalar va Markdown belgilari o'qilmasligi uchun matnni tozalaydi.
export function toSpeakableText(markdown) {
  return String(markdown || '')
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/g, ' ')
    .replace(/```[\s\S]*?(?:```|$)/g, ' ')
    .replace(/~~~[\s\S]*?(?:~~~|$)/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\\\([\s\S]*?\\\)/g, ' ')
    .replace(/\$[^$\n]+\$/g, ' ')
    .replace(/【[^】]*】/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[\d+\]\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/gm, ' ')
    .replace(/\s*\|\s*/g, ', ')
    .replace(/^\s{0,3}#{1,6}\s*(.*)$/gm, '$1.')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__|~~|\*|_)/g, '')
    .replace(/[→⇒]/g, ', ')
    .replace(/[\\{}^]/g, ' ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\s*[:;,]\s*(?=[.!?]|$)/g, '')
    .replace(/(\s*[.,]\s*){2,}/g, '. ')
    .replace(/^[\s,.;:]+|[\s,;:]+$/g, '')
    .trim()
}

const UZ_WORDS = /\b(va|bilan|uchun|bu|qanday|nima|bo['‘’ʻ]?l\w*|emas|yoki|haqida|kerak|ham|esa|lekin|siz|men|biz|ular|shu|qilib|bo['‘’ʻ]yicha|javob|savol)\b/gi
const UZ_LETTERS = /[og]['‘’ʻ`]|sh|ch/gi
const EN_WORDS = /\b(the|and|is|are|of|to|in|you|that|it|for|with|this|your|what|how|be|on|can)\b/gi

// Matn tilini taxmin qiladi: kirill → ru, o‘zbekcha belgilar → uz, aks holda en.
export function detectLanguage(text) {
  const cyrillic = (text.match(/[Ѐ-ӿ]/g) || []).length
  const latin = (text.match(/[A-Za-z]/g) || []).length
  if (cyrillic && cyrillic / (cyrillic + latin) > 0.4) return 'ru'
  const uzScore = (text.match(UZ_WORDS) || []).length * 2 + (text.match(UZ_LETTERS) || []).length * 0.5
  const enScore = (text.match(EN_WORDS) || []).length * 2
  return uzScore > enScore ? 'uz' : 'en'
}

export function findVoice(voices, language) {
  const matching = voices.filter((voice) => voice.lang?.toLowerCase().replace('_', '-').startsWith(language))
  return matching.find((voice) => voice.localService) || matching[0] || null
}

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

// Chrome uzun matnni ~15 soniyada uzib qo'yadi — gaplarga bo'lib navbatga qo'yamiz.
function splitIntoChunks(text, maxLength = 220) {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text]
  const chunks = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength && current) {
      chunks.push(current.trim())
      current = ''
    }
    current += sentence
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

// Hozir qaysi xabar o'qilayotganini butun ilova bo'ylab kuzatamiz (bir vaqtda faqat bittasi).
let speakingId = null
const listeners = new Set()
const setSpeakingId = (id) => {
  speakingId = id
  listeners.forEach((listener) => listener())
}
export const subscribeSpeaking = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const getSpeakingId = () => speakingId

export function stopSpeaking() {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
  setSpeakingId(null)
}

export function speak(id, text, voice) {
  if (!speechSupported() || !text) return
  window.speechSynthesis.cancel()
  const chunks = splitIntoChunks(text)
  chunks.forEach((chunk, index) => {
    const utterance = new SpeechSynthesisUtterance(chunk)
    utterance.voice = voice
    utterance.lang = voice.lang
    utterance.rate = 1
    if (index === chunks.length - 1) {
      utterance.onend = () => { if (speakingId === id) setSpeakingId(null) }
    }
    utterance.onerror = () => { if (speakingId === id) setSpeakingId(null) }
    window.speechSynthesis.speak(utterance)
  })
  setSpeakingId(id)
}

// Ovozlar ro'yxati asinxron yuklanadi (voiceschanged).
let voicesCache = []
let voicesLoaded = false
const voiceListeners = new Set()
function refreshVoices() {
  if (!speechSupported()) return
  const voices = window.speechSynthesis.getVoices()
  if (voices.length || voicesLoaded) {
    voicesCache = voices
    voicesLoaded = true
    voiceListeners.forEach((listener) => listener())
  }
}
export function subscribeVoices(listener) {
  voiceListeners.add(listener)
  if (speechSupported() && voiceListeners.size === 1) {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
    refreshVoices()
    // Ba'zi brauzerlar voiceschanged yubormaydi — biroz kutib, bo'sh ro'yxatni ham yakuniy deb olamiz.
    setTimeout(() => {
      voicesLoaded = true
      refreshVoices()
      voiceListeners.forEach((item) => item())
    }, 1500)
  }
  return () => {
    voiceListeners.delete(listener)
    if (speechSupported() && !voiceListeners.size) window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices)
  }
}
let voicesSnapshot = { voices: voicesCache, loaded: voicesLoaded }
export function getVoicesSnapshot() {
  if (voicesSnapshot.voices !== voicesCache || voicesSnapshot.loaded !== voicesLoaded) {
    voicesSnapshot = { voices: voicesCache, loaded: voicesLoaded }
  }
  return voicesSnapshot
}

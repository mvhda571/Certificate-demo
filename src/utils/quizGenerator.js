// Konspekt kartalari va qo'lda yozilgan savollardan har safar yangi test tuzadi:
// savollar, ularning tartibi va javob variantlari har urinishda aralashtiriladi.

export function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

// Avtomatik tuziladigan savollar matni (konspekt tiliga qarab).
const TEMPLATES = {
  uz: { which: text => `Qaysi tushuncha haqida gap ketmoqda: ${text}?`, find: text => `${text} — to‘g‘ri javobni toping.` },
  ru: { which: text => `О каком понятии идёт речь: ${text}?`, find: text => `${text} — выберите правильный ответ.` },
}

const normalize =(text) => String(text).toLowerCase().replace(/[.«»"“”]/g, '').replace(/\s+/g, ' ').trim()
const trimDot = (text) => String(text).trim().replace(/\.$/, '')
const wordCount = (text) => String(text).trim().split(/\s+/).length

// Javob turini aniqlash: noto'g'ri variantlar ham shu turdan olinadi.
function answerKind(text) {
  const value = String(text).trim()
  if (/^(mil\.\s*avv\.\s*|milodiy\s*|до н\.\s*э\.\s*|около\s*)?\d/i.test(value) && /yil|asr|ming yillik|год|г\.|век|в\.|тыс|\d\s*[–-]\s*\d/i.test(value) && wordCount(value) <= 8) return 'date'
  if (/^[IVXL]+(\s*[–-]\s*[IVXL]+)?\s+(asr|век|в\.)/.test(value)) return 'date'
  if (/^\d/.test(value)) return 'number'
  const words = wordCount(value)
  if (words <= 3) return 'short'
  if (words <= 9) return 'mid'
  return 'long'
}

// Teskari savol ("Qaysi tushuncha...?") faqat haqiqiy atamalar uchun: qisqa, yilsiz.
const MNEMONIC = /hiyla|при[её]м|запомн/i
const isTermCard = (card) => !card.front.includes('?') && !/[«»"\d]/.test(card.front) && !MNEMONIC.test(card.front) && wordCount(card.front) <= 3 && !/\d/.test(card.back)
// Eslab qolish hiylalari kartada qoladi, lekin test savoliga aylantirilmaydi.
const isMnemonicCard = (card) => MNEMONIC.test(card.front) || /^«.*»$/.test(card.front.trim())

// Noto'g'ri variantlar ma'noga yaqin bo'lishi uchun avval shu mavzudan, keyin qo'shni mavzulardan,
// so'ng butun kursdan — va har doim imkon qadar javob bilan bir xil turdan (sana, son, nom...) olinadi.
function pickDistractors(correct, candidates, kind, topicId) {
  const seen = new Set([normalize(correct)])
  const picked = []
  const tryAdd = (value) => {
    const key = normalize(value)
    if (!key || seen.has(key) || key.includes(normalize(correct)) || normalize(correct).includes(key)) return
    seen.add(key)
    picked.push(trimDot(value))
  }
  const sameKind = candidates.filter(item => answerKind(item.value) === kind)
  const distance = (item) => Math.abs((item.topicId ?? topicId) - topicId)
  const tiers = [
    sameKind.filter(item => distance(item) === 0),
    sameKind.filter(item => distance(item) > 0 && distance(item) <= 3),
    sameKind.filter(item => distance(item) > 3),
    candidates.filter(item => distance(item) <= 3),
    candidates,
  ]
  for (const tier of tiers) {
    for (const item of shuffle(tier)) { if (picked.length === 3) return picked; tryAdd(item.value) }
  }
  return picked
}

function questionFromCard(card, pool, lang) {
  const template = TEMPLATES[lang] || TEMPLATES.uz
  const reverse = isTermCard(card) && wordCount(card.back) >= 2 && Math.random() < 0.4
  if (reverse) {
    const candidates = pool.filter(item => isTermCard(item)).map(item => ({ value: item.front, topicId: item.topicId }))
    const distractors = pickDistractors(card.front, candidates, answerKind(card.front), card.topicId)
    if (distractors.length < 3) return null
    return {
      text: template.which(trimDot(card.back).includes('«') ? trimDot(card.back) : `«${trimDot(card.back)}»`),
      options: [trimDot(card.front), ...distractors], answer: 0,
      explanation: `${card.front} — ${trimDot(card.back)}.`, topicId: card.topicId,
    }
  }
  const kind = answerKind(card.back)
  const distractors = pickDistractors(card.back, pool.map(item => ({ value: item.back, topicId: item.topicId })), kind, card.topicId)
  if (distractors.length < 3) return null
  const front = trimDot(card.front)
  const text = front.endsWith('?') ? front : template.find(front.includes('«') ? front : `«${front}»`)
  return { text, options: [trimDot(card.back), ...distractors], answer: 0, explanation: `${trimDot(card.front)} — ${trimDot(card.back)}.`, topicId: card.topicId }
}

function shuffleOptions(question) {
  const order = shuffle(question.options.map((option, index) => ({ option, index })))
  return { ...question, options: order.map(item => item.option), answer: order.findIndex(item => item.index === question.answer) }
}

const factsOf = (topics) => topics.flatMap(topic => topic.flashcards.filter(card => !isMnemonicCard(card)).map(card => ({ ...card, topicId: topic.id })))

/**
 * @param {object} params
 * @param {Array} params.topics      — test qamraydigan mavzular (kartalar shulardan olinadi)
 * @param {Array} params.allTopics   — butun kurs (noto'g'ri variantlar va zaxira savollar uchun)
 * @param {Array} params.authored    — qo'lda yozilgan savollar
 * @param {number} params.size       — kerakli savollar soni
 * @param {string} params.lang       — konspekt tili (savol shablonlari uchun)
 */
export function buildQuestionSet({ topics, allTopics = topics, authored = [], size, lang = 'uz' }) {
  const pool = factsOf(allTopics)
  const result = []
  const seenText = new Set()
  const add = (question) => {
    if (!question || result.length >= size) return
    const key = normalize(question.text) + '|' + normalize(question.options[question.answer])
    if (seenText.has(key)) return
    seenText.add(key)
    result.push(question)
  }

  // Qo'lda yozilgan savollar ko'pi bilan yarmini tashkil qiladi — qolgani har safar yangidan tuziladi.
  const authoredPool = shuffle(authored)
  authoredPool.slice(0, Math.ceil(size / 2)).forEach(add)
  shuffle(factsOf(topics)).forEach(card => add(questionFromCard(card, pool, lang)))
  authoredPool.slice(Math.ceil(size / 2)).forEach(add)

  // Mavzu kartalari yetmasa, oldingi mavzulardan takrorlash savollari qo'shiladi.
  if (result.length < size) {
    const topicIds = new Set(topics.map(topic => topic.id))
    const lastId = Math.max(...topics.map(topic => topic.id))
    const review = allTopics.filter(topic => !topicIds.has(topic.id) && topic.id < lastId).reverse()
    for (const card of factsOf(review)) { if (result.length >= size) break; add(questionFromCard(card, pool, lang)) }
  }

  return shuffle(result).map(shuffleOptions)
}

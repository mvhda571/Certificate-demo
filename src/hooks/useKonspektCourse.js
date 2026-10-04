import { useEffect, useMemo, useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import { konspektCourses } from '../data/konspekt'
import { hasTranslation, loadKonspektCourse } from '../data/konspekt/localized'

const allEntries = Object.values(konspektCourses)
const NONE = {}

/**
 * Konspekt kursini joriy interfeys tilida qaytaradi.
 * Tarjima yuklanguncha (yoki umuman bo'lmasa) o'zbekcha kurs ko'rsatiladi.
 * `lang` — kurs aslida qaysi tilda ekanligi.
 */
export function useKonspektCourse(entry) {
  const language = useThemeStore(state => state.language)
  const [loaded, setLoaded] = useState({})
  const translatable = hasTranslation(entry, language)
  const cacheKey = entry ? `${entry.key}:${language}` : ''

  useEffect(() => {
    if (!translatable) return undefined
    let alive = true
    loadKonspektCourse(entry, language).then(course => { if (alive) setLoaded(previous => ({ ...previous, [cacheKey]: course })) })
    return () => { alive = false }
  }, [entry, language, translatable, cacheKey])

  if (!entry) return { course: null, lang: 'uz', loading: false }
  const course = translatable ? loaded[cacheKey] : null
  return { course: course || entry.course, lang: course ? language : 'uz', loading: translatable && !course }
}

/** Barcha konspekt kurslari joriy tilda: `{ [key]: course }` (flashcardlar sahifasi uchun). `enabled=false` — doim o'zbekcha. */
export function useKonspektCourses(enabled = true) {
  const currentLanguage = useThemeStore(state => state.language)
  const language = enabled ? currentLanguage : 'uz'
  const [loaded, setLoaded] = useState({})

  useEffect(() => {
    if (language === 'uz') return undefined
    let alive = true
    const pending = allEntries.filter(entry => hasTranslation(entry, language))
    Promise.all(pending.map(entry => loadKonspektCourse(entry, language).then(course => [entry.key, course])))
      .then(pairs => { if (alive && pairs.length) setLoaded(previous => ({ ...previous, [language]: Object.fromEntries(pairs) })) })
    return () => { alive = false }
  }, [language])

  const translated = loaded[language] || NONE
  return useMemo(() => Object.fromEntries(allEntries.map(entry => [entry.key, translated[entry.key] || entry.course])), [translated])
}

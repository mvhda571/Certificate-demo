import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

// Katta ekranda (xl) mavzular ro'yxati va dars yonma-yon turadi.
const isWideScreen = () => window.matchMedia('(min-width: 1280px)').matches

/**
 * Telefon/planshetda avval faqat mavzular ro'yxati ko'rinadi, mavzu bosilganda dars ochiladi.
 * Ochiq dars URL'da (?dars=1) saqlanadi, shuning uchun qurilmaning "orqaga" tugmasi ham ro'yxatga qaytaradi.
 */
export function useLessonView() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const lessonOpen = params.get('dars') === '1'

  const openLesson = () => {
    window.scrollTo({ top: 0 })
    if (lessonOpen || isWideScreen()) return
    const next = new URLSearchParams(params)
    next.set('dars', '1')
    setParams(next, { state: { fromList: true } })
  }

  const backToList = () => {
    window.scrollTo({ top: 0 })
    if (location.state?.fromList) { navigate(-1); return }
    const next = new URLSearchParams(params)
    next.delete('dars')
    setParams(next, { replace: true })
  }

  return {
    lessonOpen, openLesson, backToList,
    listClass: lessonOpen ? 'hidden xl:block' : '',
    lessonClass: lessonOpen ? '' : 'hidden xl:block',
  }
}

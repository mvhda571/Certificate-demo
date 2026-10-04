import { HiArrowLeft } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'

// Faqat telefon/planshetda: darsdan mavzular ro'yxatiga qaytish.
export function LessonBackButton({ onClick }) {
  const { t } = useTranslation()
  return <button type="button" onClick={onClick} className="mb-5 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 xl:hidden"><HiArrowLeft className="h-4 w-4"/> {t('backToTopics')}</button>
}

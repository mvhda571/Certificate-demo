import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertCircle, BookOpenCheck, Check, Clock, Trash2 } from '../components/AppIcons'
import { useMistakesStore } from '../store/useMistakesStore'

export function MistakesPage() {
  const { t, i18n } = useTranslation()
  const { mistakes, removeMistake, clearMistakes } = useMistakesStore()
  const [subject, setSubject] = useState('all')
  const [confirming, setConfirming] = useState(false)
  const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ'
  const counts = useMemo(() => mistakes.reduce((map, item) => ({ ...map, [item.subject]: (map[item.subject] || 0) + 1 }), {}), [mistakes])
  const activeSubject = counts[subject] ? subject : 'all'
  const visible = activeSubject === 'all' ? mistakes : mistakes.filter(item => item.subject === activeSubject)
  const clearAll = () => { clearMistakes(); setConfirming(false) }

  return <div className="space-y-6">
    <section className="hero-panel bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,.12),transparent_36%)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0"><p className="eyebrow text-red-500">{t('mistakes.eyebrow')}</p><h1 className="page-title">{t('mistakes.title')}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{t('mistakes.subtitle')}</p></div>
        {mistakes.length > 0 && (confirming
          ? <div className="flex flex-wrap gap-2"><button onClick={clearAll} className="btn-primary bg-red-500 hover:bg-red-600"><Trash2/> {t('mistakes.confirmClear')}</button><button onClick={() => setConfirming(false)} className="btn-secondary">{t('mistakes.cancel')}</button></div>
          : <button onClick={() => setConfirming(true)} className="btn-secondary text-red-500"><Trash2/> {t('mistakes.clearAll')}</button>)}
      </div>
    </section>

    {mistakes.length ? <>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{['all', ...Object.keys(counts)].map(key => <button key={key} onClick={() => setSubject(key)} className={`pill shrink-0 whitespace-nowrap border transition ${activeSubject === key ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-red-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{key === 'all' ? t('mistakes.all') : t(`mistakes.subjects.${key}`)} · {key === 'all' ? mistakes.length : counts[key]}</button>)}</div>
      <p className="text-sm font-semibold text-slate-500">{t('mistakes.count', { count: visible.length })}</p>
      <div className="grid gap-4">
        <AnimatePresence initial={false}>{visible.map((item, index) => <motion.article key={item.key} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * .04 } }} exit={{ opacity: 0, scale: .97 }} className="card-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="pill bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">{t(`mistakes.subjects.${item.subject}`)}{item.grade && ` · ${item.grade}`}</span>
            {item.topic && <span className="min-w-0 max-w-full truncate text-slate-400">{item.topic}</span>}
          </div>
          <p className="mt-3 font-semibold leading-7">{item.question}</p>
          {item.imageUrl && <img src={item.imageUrl} alt="" className="mt-3 max-h-72 w-full rounded-xl object-contain"/>}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10"><dt className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-300"><AlertCircle className="h-4 w-4"/>{t('mistakes.yourAnswer')}</dt><dd className="mt-1 break-words">{item.selected ?? <i className="text-slate-500">{t('mistakes.unanswered')}</i>}</dd></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10"><dt className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-300"><Check className="h-4 w-4"/>{t('mistakes.correctAnswer')}</dt><dd className="mt-1 break-words">{item.correct}</dd></div>
          </dl>
          {item.explanation && <div className="mt-3 rounded-xl bg-blue-50 p-4 text-sm leading-6 dark:bg-blue-500/10"><b className="text-blue-700 dark:text-blue-300">{t('mistakes.explanation')}</b><p className="mt-1 text-slate-600 dark:text-slate-300">{item.explanation}</p></div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/>{t('mistakes.missedAt', { date: new Date(item.missedAt).toLocaleDateString(locale) })}{item.missCount > 1 && <b className="text-red-500"> · {t('mistakes.missCount', { count: item.missCount })}</b>}</span>
            <button onClick={() => removeMistake(item.key)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-bold text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><Check className="h-4 w-4"/>{t('mistakes.learned')}</button>
          </div>
        </motion.article>)}</AnimatePresence>
      </div>
    </> : <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-panel p-10 text-center sm:p-12">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10"><BookOpenCheck className="h-8 w-8"/></span>
      <h2 className="mt-5 text-xl font-bold">{t('mistakes.emptyTitle')}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{t('mistakes.emptyText')}</p>
      <Link to="/tests" className="btn-primary mt-6">{t('mistakes.startTest')}</Link>
    </motion.section>}
  </div>
}

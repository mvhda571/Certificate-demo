import { useState } from 'react'
import { AlertCircle, BarChart3, BookOpenCheck, Clock as Clock3, Target } from '../components/AppIcons'
import { PremiumCertificateIcon } from '../components/PremiumCertificateIcon'
import { SubjectProgressCharts } from '../components/SubjectProgressCharts'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTestStore } from '../store/useTestStore'
import { useUserStore } from '../store/useUserStore'
import { useLearningStore } from '../store/useLearningStore'

const gradeFor = percent => percent >= 93 ? 'A+' : percent >= 86 ? 'A' : percent >= 78 ? 'B+' : percent >= 70 ? 'B' : percent >= 62 ? 'C+' : percent >= 55 ? 'C' : 'O‘tmadi'

export function ResultsPage() {
  const { t, i18n } = useTranslation()
  const attempts = useTestStore(state => state.attempts)
  const completed = useLearningStore(state => state.completed)
  const { profile, points } = useUserStore()
  const latestThree = attempts.slice(0, 3)
  const average = latestThree.length ? Math.round(latestThree.reduce((sum,item)=>sum+item.percent,0)/latestThree.length) : 0
  const forecast = gradeFor(average)
  const lessonCount = Object.keys(completed).length
  const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ'
  const cards = [[BarChart3,t('resultsPage.averageTest'),`${average}%`],[BookOpenCheck,t('resultsPage.completedLessons'),lessonCount],[PremiumCertificateIcon,t('resultsPage.certificateForecast'),forecast],[Target,t('resultsPage.totalXp'),points]]
  return <div className="space-y-6">
    <section className="hero-panel"><p className="eyebrow">{t('resultsPage.cabinet')}</p><h1 className="page-title">{t('resultsPage.welcome',{name:profile.name.split(' ')[0]})}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('resultsPage.averageCertificate')}: <b className="text-emerald-600">{average}% · {forecast}</b></p><p className="mt-1 text-xs text-slate-400">{t('resultsPage.lastThreeHint',{count:latestThree.length})}</p></section>
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{cards.map(([Icon,label,value])=><div key={label} className="card-panel min-w-0 p-4 sm:p-5"><Icon className={label===t('resultsPage.certificateForecast')?'':'h-5 w-5 text-blue-600'}/><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-300 sm:mt-5 sm:text-sm">{label}</p><p className="mt-1 break-words text-2xl font-black sm:text-3xl">{value}</p></div>)}</div>
    <SubjectProgressCharts/>
    <section className="card-panel overflow-hidden"><div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6"><h2 className="text-xl font-bold">{t('resultsPage.history')}</h2><p className="mt-1 text-sm text-slate-500">{t('resultsPage.historyHint')}</p></div>{attempts.length?<div className="divide-y divide-slate-100 dark:divide-slate-800">{attempts.map(attempt=><AttemptHistory key={attempt.id} attempt={attempt} locale={locale} t={t}/>)}</div>:<div className="p-8 text-center sm:p-12"><BookOpenCheck className="mx-auto h-10 w-10 text-slate-300"/><h3 className="mt-4 font-bold">{t('resultsPage.empty')}</h3><p className="mt-2 text-sm text-slate-500">{t('resultsPage.emptyHint')}</p><Link to="/tests" className="btn-primary mt-5">{t('resultsPage.startTest')}</Link></div>}</section>
  </div>
}

function AttemptHistory({ attempt, locale, t }) {
  const [open, setOpen] = useState(false)
  const errors = attempt.errors || []
  return <article>
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div><p className="font-semibold">{attempt.title||attempt.testId}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3 w-3"/>{new Date(attempt.id).toLocaleDateString(locale)} · {t('resultsPage.mistakeCount',{count:errors.length})}</p></div>
      <div className="flex items-center gap-3"><div className="text-right"><b className="text-xl">{attempt.percent}%</b><span className="ml-3 pill bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10">{attempt.certificateLevel||gradeFor(attempt.percent)}</span></div><span className={`text-xl transition ${open?'rotate-180':''}`}>⌄</span></div>
    </button>
    {open && <div className="border-t border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">{errors.length?<div className="space-y-3">{errors.map((error,index)=><ErrorAccordion key={error.id||`${attempt.id}-${index}`} error={error} index={index} t={t}/>)}</div>:<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10">{t('resultsPage.noMistakes')}</div>}</div>}
  </article>
}

function ErrorAccordion({ error, index, t }) {
  const [open, setOpen] = useState(false)
  const selected = error.selectedOption == null ? t('resultsPage.unanswered') : error.options?.[error.selectedOption]
  const correct = error.back || error.options?.[error.correctOption]
  return <article className="overflow-hidden rounded-2xl border border-red-200 bg-white dark:border-red-500/20 dark:bg-slate-900">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 p-4 text-left">
      <div className="flex min-w-0 gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500"/><div><p className="text-xs font-bold uppercase tracking-wider text-red-500">{error.id || `${t('resultsPage.question')} ${index+1}`}</p><p className="mt-1 font-semibold leading-6">{error.front || error.question || error.text}</p></div></div><span className={`shrink-0 text-xl transition ${open?'rotate-180':''}`}>⌄</span>
    </button>
    {open && <div className="border-t border-red-100 p-4 dark:border-red-500/10">{error.questionImageUrl&&<img src={error.questionImageUrl} alt={error.questionImageAlt||t('resultsPage.questionImage')} className="mb-4 max-h-80 w-full rounded-xl object-contain"/>}<dl className="grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/10"><dt className="font-bold text-red-600">{t('resultsPage.yourAnswer')}</dt><dd className="mt-1">{selected||t('resultsPage.unanswered')}</dd></div><div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10"><dt className="font-bold text-emerald-600">{t('resultsPage.correctAnswer')}</dt><dd className="mt-1">{correct}</dd></div></dl><div className="mt-3 rounded-xl bg-blue-50 p-4 text-sm leading-6 dark:bg-blue-500/10"><b className="text-blue-700 dark:text-blue-300">{t('resultsPage.analysis')}</b><p className="mt-1 text-slate-600 dark:text-slate-300">{error.explanation||t('resultsPage.noAnalysis')}</p></div></div>}
  </article>
}

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { HiArrowLeft as FiArrowLeft, HiArrowRight as FiArrowRight, HiBookOpen as FiBookOpen, HiLockClosed as FiLock } from 'react-icons/hi'
import { historyGrades } from '../data/historyCurriculum'
import { useTranslation } from 'react-i18next'
import { findKonspektCourse, historyTracks, localize } from '../data/konspekt'

// 5-sinf eski PDF darslarida, 6-sinf bitta konspekt kursida, 7–11-sinflar ikki yo'nalishda.
const gradeInfo = (grade, lang) => {
  if (historyGrades[grade]) return historyGrades[grade]
  const konspekt = localize(findKonspektCourse(grade), lang)
  if (konspekt) return { count: konspekt.course.topics.length, period: konspekt.period }
  return historyTracks[grade] ? {} : null
}

export function HistoryGradesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const trackTitles = grade => historyTracks[grade].map(track => localize(track, lang).title).join(' · ')
  const grid = useRef(null)
  useEffect(()=>{const context=gsap.context(()=>gsap.fromTo('[data-grade]',{opacity:0,y:22},{opacity:1,y:0,stagger:.08,duration:.5}),grid);return()=>context.revert()},[])
  return <div className="space-y-7"><Link to="/subjects" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><FiArrowLeft/> {t('konspekt.backToSubjects')}</Link><section className="hero-panel bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.15),transparent_35%)]"><p className="eyebrow text-orange-600">{t('konspekt.historySubject')}</p><h1 className="page-title">{t('konspekt.chooseGrade')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{t('konspekt.gradesInfo')}</p></section><section ref={grid} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[5,6,7,8,9,10,11].map(grade=>{const data=gradeInfo(grade, lang);return data?<Link data-grade key={grade} to={`/subjects/tarix/grade/${grade}`} className="group card-panel p-6 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10"><FiBookOpen className="h-6 w-6"/></span><p className="mt-5 text-xs font-bold uppercase tracking-widest text-orange-500">{historyTracks[grade] ? t('konspekt.tracksCount', { count: historyTracks[grade].length }) : t('konspekt.paragraphs', { count: data.count })}</p><h2 className="mt-2 text-2xl font-black">{t('konspekt.grade', { grade })}</h2><p className="mt-2 min-h-10 text-sm text-slate-500">{historyTracks[grade] ? trackTitles(grade) : data.period}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-orange-600 dark:border-slate-800">{t('konspekt.openLessons')} <FiArrowRight className="transition group-hover:translate-x-1"/></div></Link>:<div data-grade key={grade} className="relative cursor-not-allowed overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900"><div className="absolute inset-0 grid place-items-center bg-white/50 backdrop-blur-[3px] dark:bg-slate-950/55"><div className="text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white"><FiLock/></span><b className="mt-3 block">5-sinf</b><span className="text-xs text-slate-500">Tez orada...</span></div></div><div className="opacity-30"><FiBookOpen className="h-10 w-10"/><h2 className="mt-5 text-2xl font-black">5-sinf</h2></div></div>})}</section></div>
}

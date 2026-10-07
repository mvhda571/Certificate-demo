import { useEffect, useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useTranslation } from 'react-i18next'
import { HiArrowLeft, HiArrowRight, HiBookOpen, HiLockClosed, HiPencilAlt } from 'react-icons/hi'
import uzbekGrades from '../data/uzbekCurriculum.json'
import literatureGrades from '../data/literatureCurriculum.json'
import { findKonspektCourse } from '../data/konspekt'
import { HistoryProgram } from './HistoryGradePage'
import { UzbekGradePage } from './UzbekGradePage'
import { LiteratureGradePage } from './LiteratureGradePage'

// "Ona tili va adabiyot" bitta bo'lim: avval sinf, keyin fan tanlanadi.
// Konspekt kursi bo'lsa (masalan, 5-sinf adabiyot) — konspekt dasturi, aks holda eski darslik sahifasi ochiladi.
export const LANG_LIT_PATH = '/subjects/ona-tili-adabiyot'
const GRADES = ['5', '6', '7', '8', '9', '10', '11']
const SECTIONS = [
  { id: 'ona-tili', icon: HiPencilAlt, legacy: grade => uzbekGrades[grade] ? { count: uzbekGrades[grade].lessons.length } : null },
  { id: 'adabiyot', icon: HiBookOpen, legacy: grade => literatureGrades[grade]?.available ? { count: literatureGrades[grade].lessons.length } : null },
]

function sectionInfo(section, grade) {
  const konspekt = findKonspektCourse(grade, null, section.id)
  if (konspekt) return { konspekt, count: konspekt.course.topics.length }
  return section.legacy(grade)
}

const availableSections = grade => SECTIONS.filter(section => sectionInfo(section, grade))

function LockedCard({ title, note }) {
  return <div className="relative cursor-not-allowed overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900">
    <div className="absolute inset-0 z-10 grid place-items-center bg-white/50 backdrop-blur-[3px] dark:bg-slate-950/55"><div className="max-w-52 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white"><HiLockClosed/></span><b className="mt-3 block">{title}</b><span className="text-xs text-slate-500">{note}</span></div></div>
    <div className="opacity-30"><HiBookOpen className="h-10 w-10"/><h2 className="mt-5 text-2xl font-black">{title}</h2></div>
  </div>
}

export function LanguageLiteratureGradesPage() {
  const { t } = useTranslation()
  const grid = useRef(null)
  useEffect(() => { const context = gsap.context(() => gsap.fromTo('[data-grade]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, stagger: .08, duration: .5 }), grid); return () => context.revert() }, [])
  return <div className="space-y-7">
    <Link to="/subjects" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><HiArrowLeft/> {t('konspekt.backToSubjects')}</Link>
    <section className="hero-panel bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,.15),transparent_35%)]"><p className="eyebrow text-violet-600">{t('langLit.subject')}</p><h1 className="page-title">{t('konspekt.chooseGrade')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{t('langLit.gradesInfo')}</p></section>
    <section ref={grid} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{GRADES.map(grade => {
      const sections = availableSections(grade)
      if (!sections.length) return <div data-grade key={grade}><LockedCard title={t('konspekt.grade', { grade })} note={t('konspekt.soon')}/></div>
      return <Link data-grade key={grade} to={`${LANG_LIT_PATH}/grade/${grade}`} className="group card-panel p-6 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10"><HiBookOpen className="h-6 w-6"/></span>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-violet-500">{t('langLit.sectionsCount', { count: sections.length })}</p>
        <h2 className="mt-2 text-2xl font-black">{t('konspekt.grade', { grade })}</h2>
        <p className="mt-2 min-h-10 text-sm text-slate-500">{sections.map(section => t(`langLit.${section.id}`)).join(' · ')}</p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-violet-600 dark:border-slate-800">{t('konspekt.openLessons')} <HiArrowRight className="transition group-hover:translate-x-1"/></div>
      </Link>
    })}</section>
  </div>
}

function SectionChooser({ grade }) {
  const { t } = useTranslation()
  return <div className="space-y-7">
    <Link to={LANG_LIT_PATH} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><HiArrowLeft/> {t('konspekt.backToGrades')}</Link>
    <section className="hero-panel"><p className="eyebrow text-violet-600">{t('langLit.gradeEyebrow', { grade })}</p><h1 className="page-title">{t('langLit.chooseSection')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{t('langLit.sectionsInfo', { grade })}</p></section>
    <section className="grid gap-5 sm:grid-cols-2">{SECTIONS.map(section => {
      const info = sectionInfo(section, grade)
      const title = t(`langLit.${section.id}`)
      if (!info) return <LockedCard key={section.id} title={title} note={t('konspekt.soon')}/>
      const Icon = section.icon
      return <Link key={section.id} to={`${LANG_LIT_PATH}/grade/${grade}/${section.id}`} className="group card-panel p-6 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10"><Icon className="h-6 w-6"/></span>
        <h2 className="mt-5 text-2xl font-black">{title}</h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{info.konspekt ? t('langLit.konspektInfo', { count: info.count }) : t('langLit.lessonsInfo', { count: info.count })}</p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-violet-600 dark:border-slate-800">{t('konspekt.openLessons')} <HiArrowRight className="transition group-hover:translate-x-1"/></div>
      </Link>
    })}</section>
  </div>
}

export function LanguageLiteratureGradePage() {
  const { t } = useTranslation()
  const { gradeId, section: sectionId } = useParams()
  const section = SECTIONS.find(item => item.id === sectionId)
  if (!GRADES.includes(gradeId) || !availableSections(gradeId).length) return <Navigate to={LANG_LIT_PATH} replace/>
  if (!sectionId) return <SectionChooser grade={gradeId}/>
  const info = section && sectionInfo(section, gradeId)
  if (!info) return <Navigate to={`${LANG_LIT_PATH}/grade/${gradeId}`} replace/>
  if (info.konspekt) return <HistoryProgram key={info.konspekt.key} grade={gradeId} entry={info.konspekt} backTo={`${LANG_LIT_PATH}/grade/${gradeId}`} backLabel={t('langLit.backToSections')} eyebrow={t('langLit.programEyebrow', { grade: gradeId, title: t(`langLit.${section.id}`) })}/>
  return section.id === 'ona-tili' ? <UzbekGradePage/> : <LiteratureGradePage/>
}

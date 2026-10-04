import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { HiArrowRight, HiBookOpen, HiLockClosed } from 'react-icons/hi'
import { SiLibreofficemath } from 'react-icons/si'
import { subjects } from '../data/curriculum'
import { useUserStore } from '../store/useUserStore'
import { useTranslation } from 'react-i18next'

export function SubjectsPage() {
  const { t } = useTranslation()
  const grid = useRef(null)
  const selectedGrade = useUserStore(state => state.profile.grade?.match(/\d+/)?.[0])

  useEffect(() => {
    const context = gsap.context(() => gsap.fromTo('[data-subject-card]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: .07, duration: .5 }), grid)
    return () => context.revert()
  }, [])

  return <div className="space-y-6 sm:space-y-8">
    <section className="hero-panel overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.13),transparent_36%)]">
      <p className="eyebrow">{selectedGrade ? t('gradeCurriculum',{grade:selectedGrade}) : t('allGradesCurriculum')}</p>
      <h1 className="page-title">{t('subjectsBooks')}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{selectedGrade ? t('gradeMaterials',{grade:selectedGrade}) : t('allMaterials')} {t('progressUnlock')}</p>
    </section>
    <aside role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{t('applicantBooksNotice')}</aside>
    <section ref={grid} className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      {subjects.map(subject => subject.active ? <Link data-subject-card key={subject.id} to={subject.id === 'matematika' ? '/subjects/matematika/grades' : `/subjects/${subject.id}`} className="group card-panel overflow-hidden p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${subject.color} text-white`}>
          {subject.id === 'matematika' ? <SiLibreofficemath className="h-6 w-6"/> : <HiBookOpen className="h-6 w-6"/>}
        </span>
        <h2 className="mt-5 text-xl font-bold">{subject.title}</h2>
        <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-300">{subject.short}</p>
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-emerald-600 dark:border-slate-800">{t('openLessons')} <HiArrowRight/></div>
      </Link> : <div data-subject-card key={subject.id} aria-disabled="true" className="flex cursor-not-allowed items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-slate-100/70 p-4 dark:border-slate-700 dark:bg-slate-900/60 sm:p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-200 text-slate-400 dark:bg-slate-800"><HiBookOpen className="h-6 w-6"/></span>
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-slate-400">{subject.title}</h2>
        <span className="pill flex shrink-0 items-center gap-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900"><HiLockClosed/>{t('soon')}</span>
      </div>)}
    </section>
  </div>
}

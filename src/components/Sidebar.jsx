import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from './BrandLogo'
import { navItems } from '../data/navItems'
import { useStreakStore } from '../store/useStreakStore'
import { useFlashcardDeck } from '../hooks/useFlashcardDeck'

export function NavItemLink({ item: [label, to, Icon], dueCount = 0, onClick }) {
  const { t } = useTranslation()
  return <NavLink onClick={onClick} to={to} end={to === '/'} className={({isActive}) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Icon className="h-5 w-5"/>{t(label)}{label==='flashcards'&&dueCount>0&&<span title={t('flashcardsDue',{count:dueCount})} className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{dueCount}</span>}</NavLink>
}

export function StreakCard({ className = '' }) {
  const { t } = useTranslation()
  const streak = useStreakStore(state => state.streak)
  return <div className={`shrink-0 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:from-orange-500/10 dark:to-amber-500/5 ${className}`}><p className="text-xs font-bold uppercase tracking-wider text-orange-500">{t('readingStreak')}</p><p className="mt-2 text-2xl font-black">{t('days',{count:streak})}</p><p className="mt-1 text-xs text-slate-500">{t('streakHint')}</p></div>
}

// Faqat desktop (lg+) uchun; telefonda uning vazifasini BottomNav bajaradi.
export function Sidebar() {
  const dueCount = useFlashcardDeck().dueCards.length
  return <aside className="sticky top-8 z-50 hidden h-[calc(100vh-4rem)] w-72 shrink-0 flex-col overflow-y-auto rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-glow dark:border-slate-800 dark:bg-slate-900 lg:flex">
    <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 shadow-md"><BrandLogo className="h-10 w-10 drop-shadow-[0_2px_5px_rgba(255,255,255,.2)]"/></span><div><h2 className="font-bold">Certificate</h2><p className="text-xs text-slate-400">Academy</p></div></div>
    <nav className="mb-6 mt-8 flex flex-col gap-1">{navItems.map(item => <NavItemLink key={item[1]} item={item} dueCount={dueCount}/>)}</nav>
    <StreakCard className="mt-auto"/>
  </aside>
}

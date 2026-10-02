import { FiGrid, FiHome, FiMessageCircle, FiPieChart, FiTarget, FiUser, FiX } from 'react-icons/fi'
import { GiBookshelf } from 'react-icons/gi'
import { FaTrophy } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from './BrandLogo'
import { useStreakStore } from '../store/useStreakStore'
import { useFlashcardDeck } from '../hooks/useFlashcardDeck'

export function Sidebar({ open, onClose }) {
  const { t } = useTranslation()
  const streak = useStreakStore(state => state.streak)
  const dueCount = useFlashcardDeck().dueCards.length
  const items = [['dashboard','/',FiHome],['subjects','/subjects',GiBookshelf],['tests','/tests',FiTarget],['flashcards','/flashcards',FiGrid],['results','/results',FiPieChart],['leaderboard','/leaderboard',FaTrophy],['tutor','/tutor',FiMessageCircle],['profile','/profile',FiUser]]
  return <><div onClick={onClose} className={`fixed inset-0 z-40 bg-slate-950/50 lg:hidden ${open ? 'block' : 'hidden'}`}/><aside className={`fixed inset-y-3 left-3 z-50 flex w-72 flex-col rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-2xl transition-transform dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:shadow-glow ${open ? 'translate-x-0' : '-translate-x-[110%]'}`}>
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 shadow-md"><BrandLogo className="h-10 w-10 drop-shadow-[0_2px_5px_rgba(255,255,255,.2)]"/></span><div><h2 className="font-bold">Certificate</h2><p className="text-xs text-slate-400">Academy</p></div></div><button onClick={onClose} className="icon-button lg:hidden"><FiX/></button></div>
    <nav className="mt-8 flex flex-col gap-1">{items.map(([label,to,Icon]) => <NavLink onClick={onClose} key={to} to={to} end={to === '/'} className={({isActive}) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Icon className="h-5 w-5"/>{t(label)}{label==='flashcards'&&dueCount>0&&<span title={t('flashcardsDue',{count:dueCount})} className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{dueCount}</span>}</NavLink>)}</nav>
    <div className="mt-auto rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:from-orange-500/10 dark:to-amber-500/5"><p className="text-xs font-bold uppercase tracking-wider text-orange-500">{t('readingStreak')}</p><p className="mt-2 text-2xl font-black">{t('days',{count:streak})}</p><p className="mt-1 text-xs text-slate-500">{t('streakHint')}</p></div>
  </aside></>
}

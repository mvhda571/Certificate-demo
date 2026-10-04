import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FiMoreHorizontal, FiX } from 'react-icons/fi'
import { NavItemLink, StreakCard } from './Sidebar'
import { navItems } from '../data/navItems'
import { useFlashcardDeck } from '../hooks/useFlashcardDeck'

// Doimiy tablar — o'quvchi eng ko'p ochadigan bo'limlar (o'qish → test → natija sikli). Qolganlari "Boshqalar"da.
const PRIMARY = { '/': 'home', '/subjects': 'subjects', '/tests': 'tests', '/results': 'results' }
const primaryTabs = navItems.filter(([, to]) => PRIMARY[to])
const moreItems = navItems.filter(([, to]) => !PRIMARY[to])
// /analytics — profil sahifasining eski manzili.
const morePaths = [...moreItems.map(([, to]) => to), '/analytics']
const isMorePath = pathname => morePaths.some(to => pathname === to || pathname.startsWith(`${to}/`))

const tabClass = active => `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`

function TabContent({ Icon, label, active, badge }) {
  return <motion.span whileTap={{ scale: .88 }} className="flex flex-col items-center gap-1">
    <span className={`relative grid h-8 w-12 place-items-center rounded-full transition ${active ? 'bg-emerald-50 dark:bg-emerald-500/15' : ''}`}><Icon className="h-5 w-5"/>{badge > 0 && <span className="absolute right-1.5 top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"/>}</span>
    <span className="max-w-full truncate px-1">{label}</span>
  </motion.span>
}

// Telefon/planshet uchun yagona navigatsiya. Sidebar `lg` dan boshlab ko'rinadi, shuning uchun bu panel `lg:hidden`.
export function BottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // Panel qaysi sahifada ochilganini eslaymiz: boshqa sahifaga o'tilsa (havola yoki "orqaga" tugmasi) u o'zi yopiladi.
  const [openedAt, setOpenedAt] = useState(null)
  const moreOpen = openedAt === pathname
  const dueCount = useFlashcardDeck().dueCards.length
  const close = () => setOpenedAt(null)

  useEffect(() => {
    if (!moreOpen) return
    const onKey = event => event.key === 'Escape' && setOpenedAt(null)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [moreOpen])

  return <div className="lg:hidden">
    <nav aria-label={t('bottomNav.label')} className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
        {primaryTabs.map(([, to, Icon]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => <TabContent Icon={Icon} label={t(`bottomNav.${PRIMARY[to]}`)} active={isActive}/>}
        </NavLink>)}
        <button type="button" onClick={() => setOpenedAt(value => value === pathname ? null : pathname)} aria-expanded={moreOpen} aria-haspopup="dialog" className={tabClass(moreOpen || isMorePath(pathname))}>
          <TabContent Icon={FiMoreHorizontal} label={t('bottomNav.more')} active={moreOpen || isMorePath(pathname)} badge={dueCount}/>
        </button>
      </div>
    </nav>

    <AnimatePresence>{moreOpen && <>
      <motion.div key="backdrop" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] bg-slate-950/50 backdrop-blur-[2px]"/>
      <motion.section key="sheet" role="dialog" aria-modal="true" aria-label={t('bottomNav.moreTitle')} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }} className="fixed inset-x-0 bottom-0 z-[1101] mx-auto max-h-[85vh] max-w-xl overflow-y-auto rounded-t-[28px] border border-b-0 border-slate-200/70 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto block h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700"/>
        <div className="mt-3 flex items-center justify-between px-1"><h2 className="text-lg font-bold">{t('bottomNav.moreTitle')}</h2><button type="button" onClick={close} className="icon-button" aria-label={t('bottomNav.close')}><FiX/></button></div>
        <nav className="mt-3 flex flex-col gap-1">{moreItems.map(item => <NavItemLink key={item[1]} item={item} dueCount={dueCount} onClick={close}/>)}</nav>
        <StreakCard className="mt-4"/>
      </motion.section>
    </>}</AnimatePresence>
  </div>
}

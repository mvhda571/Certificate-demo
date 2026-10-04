import { useMemo } from 'react'
import { FaFire, FaMedal, FaTrophy } from 'react-icons/fa'
import { FiStar } from 'react-icons/fi'
import { leaderboardStudents } from '../data/leaderboard'
import { useStreakStore } from '../store/useStreakStore'
import { useUserStore } from '../store/useUserStore'

const podium = {
  1: { label: 'Oltin', icon: 'text-amber-400', row: 'border-amber-300 bg-amber-50/80 dark:border-amber-500/40 dark:bg-amber-500/10' },
  2: { label: 'Kumush', icon: 'text-slate-400', row: 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/70' },
  3: { label: 'Bronza', icon: 'text-orange-600', row: 'border-orange-300 bg-orange-50/70 dark:border-orange-500/40 dark:bg-orange-500/10' },
}

const initials = name => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()

function StudentAvatar({ student }) {
  return student.photoURL
    ? <img src={student.photoURL} alt="" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-11 sm:w-11"/>
    : <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs sm:h-11 sm:w-11 sm:text-sm ${student.color || 'from-blue-500 to-emerald-500'} font-black text-white`}>{initials(student.name)}</span>
}

export function LeaderboardPage() {
  const { profile, points } = useUserStore()
  const streak = useStreakStore(state => state.streak)
  const ranking = useMemo(() => [...leaderboardStudents, { id: 'current-user', name: profile.displayName || profile.name || 'Siz', photoURL: profile.photoURL, xp: points, streak, isCurrent: true }].sort((a, b) => b.xp - a.xp || b.streak - a.streak).map((student, index) => ({ ...student, rank: index + 1 })), [points, profile.displayName, profile.name, profile.photoURL, streak])
  const currentUser = ranking.find(student => student.isCurrent)

  return <div className="space-y-6">
    <section className="hero-panel overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,.16),transparent_35%)]"><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center sm:h-14 sm:w-14 rounded-2xl bg-amber-100 text-amber-500 dark:bg-amber-500/15"><FaTrophy className="h-7 w-7"/></span><div><p className="eyebrow text-amber-600">Certificate Academy</p><h1 className="page-title">O‘quvchilar reytingi</h1><p className="mt-2 text-sm text-slate-500">XP va kunlik streak bo‘yicha eng faol o‘quvchilar.</p></div></div></section>

    <section className="card-panel overflow-hidden">
      <div className="hidden grid-cols-[72px_1fr_140px_140px] border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 md:grid"><span>O‘rin</span><span>O‘quvchi</span><span>XP ball</span><span>Streak</span></div>
      <div className="space-y-2 p-3 sm:p-4">{ranking.map(student => {
        const medal = podium[student.rank]
        return <div key={student.id} className={`grid grid-cols-[36px_1fr_auto] items-center gap-x-3 gap-y-1 rounded-2xl border p-3 transition md:grid-cols-[56px_1fr_140px_140px] ${student.isCurrent ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400/20 dark:bg-emerald-500/10' : medal?.row || 'border-transparent bg-slate-50 dark:bg-slate-800/60'}`}>
          <div className="row-span-2 flex items-center md:row-span-1">{medal ? <FaMedal title={`${medal.label} medal`} className={`h-7 w-7 ${medal.icon}`}/> : <b className="w-7 text-center text-sm text-slate-400 md:text-base">#{student.rank}</b>}</div>
          <div className="row-span-2 flex min-w-0 items-center gap-3 md:row-span-1"><StudentAvatar student={student}/><div className="min-w-0"><b className="block truncate">{student.name}</b>{student.isCurrent && <span className="text-xs font-bold text-emerald-600">Bu siz</span>}</div></div>
          <div className="flex items-center justify-end gap-1.5 text-sm font-black text-blue-600 md:justify-start md:gap-2 md:text-base"><FiStar/><span>{student.xp.toLocaleString()} XP</span></div>
          <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-orange-500 md:justify-start md:gap-2 md:text-base"><FaFire/><span>{student.streak} kun</span></div>
        </div>
      })}</div>
    </section>

    <section className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-4 rounded-3xl border border-emerald-400/30 bg-slate-900/95 p-4 text-white sm:p-5 lg:bottom-3 shadow-2xl backdrop-blur-xl dark:bg-emerald-950/95"><div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-[.2em] text-emerald-400 sm:text-xs sm:tracking-[.25em]">Sizning natijangiz · doimiy ko‘rsatkich</p><h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-2xl">#{currentUser.rank} o‘rin</h2><p className="mt-1 hidden text-sm text-slate-300 sm:block">Keyingi dars va testlar orqali reytingingizni oshiring.</p></div><div className="flex shrink-0 gap-4 text-right sm:gap-6"><div><p className="text-xs text-slate-400">XP</p><b className="text-xl">{currentUser.xp.toLocaleString()}</b></div><div><p className="text-xs text-slate-400">Streak</p><b className="text-xl text-orange-400">{currentUser.streak} kun</b></div></div></section>
  </div>
}

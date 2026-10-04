import { AlertCircle, ArrowRight, Bell, Send, User } from '../components/AppIcons'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GoogleAccountCard } from '../components/GoogleAccountCard'
import { useUserStore } from '../store/useUserStore'
import { useMistakesStore } from '../store/useMistakesStore'

export function ProfilePage() {
  const { t } = useTranslation()
  const { profile, points, updateProfile, notifications, toggleNotifications } = useUserStore()
  const mistakeCount = useMistakesStore(state => state.mistakes.length)
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: profile })
  const submit = data => { updateProfile(data); toast.success('Profil saqlandi') }
  return <div className="space-y-6">
    <section className="hero-panel flex flex-wrap items-center gap-4">
      {profile.photoURL ? <img src={profile.photoURL} alt="Google profil rasmi" referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover shadow"/> : <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-xl font-black text-white">{(profile.name || 'U').slice(0,2).toUpperCase()}</span>}
      <div className="flex-1"><p className="eyebrow">Shaxsiy kabinet</p><h1 className="page-title">{profile.displayName || profile.name}</h1><p className="mt-1 text-sm text-slate-500">{points} XP · Maqsad: {profile.targetGrade}</p></div>
      <button onClick={toggleNotifications} className={`btn-secondary ${notifications ? 'text-emerald-600' : ''}`}><Bell/> Telegram {notifications ? 'yoqilgan' : 'o‘chiq'}</button>
    </section>
    <GoogleAccountCard profile={profile}/>
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(submit)} className="card-panel p-6"><div className="flex items-center gap-2"><User className="text-blue-600"/><h2 className="font-bold">Profil sozlamalari</h2></div><div className="mt-5 space-y-4"><Field label="Ism" error={errors.name?.message}><input {...register('name',{required:'Ism majburiy',minLength:{value:3,message:'Kamida 3 ta belgi'}})} className="form-input"/></Field><Field label="Telegram username" error={errors.telegram?.message}><input placeholder="@username" {...register('telegram',{pattern:{value:/^$|^@[a-zA-Z0-9_]{5,}$/,message:'@username formatida kiriting'}})} className="form-input"/></Field><Field label="Maqsad daraja"><select {...register('targetGrade')} className="form-input"><option>A+</option><option>A</option><option>B+</option><option>B</option><option>C+</option><option>C</option><option>B1</option><option>B2</option><option>C1</option></select></Field><button className="btn-primary w-full"><Send/> Saqlash va botga ulash</button></div></form>
    </div>
    <Link to="/mistakes" className="group card-panel flex items-center gap-4 p-5 transition hover:border-red-300 sm:p-6"><span className="icon-box bg-red-50 text-red-500 dark:bg-red-500/10"><AlertCircle/></span><div className="min-w-0 flex-1"><h2 className="font-bold">{t('mistakes.profileLink')}</h2><p className="mt-1 text-sm text-slate-500">{t('mistakes.profileLinkHint', { count: mistakeCount })}</p></div><ArrowRight className="h-5 w-5 shrink-0 text-red-500 transition group-hover:translate-x-1"/></Link>
  </div>
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-500">{error}</span>}</label> }

import { Bell, Send, Trash2, User } from '../components/AppIcons'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { GoogleAccountCard } from '../components/GoogleAccountCard'
import { useUserStore } from '../store/useUserStore'
import { useTestStore } from '../store/useTestStore'

export function ProfilePage() {
  const { profile, points, updateProfile, notifications, toggleNotifications } = useUserStore()
  const { errorLog, clearErrors } = useTestStore()
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
    <section className="card-panel p-6"><div className="flex items-center justify-between"><div><p className="eyebrow text-orange-500">My Mistakes</p><h2 className="mt-1 text-xl font-bold">Xatolar tahlili</h2></div><button onClick={clearErrors} className="icon-button"><Trash2/></button></div>{errorLog.length ? <div className="mt-5 grid gap-3">{errorLog.map((question,index)=><details key={`${question.id}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><summary className="cursor-pointer font-semibold">{question.text}</summary><p className="mt-3 text-sm text-slate-500">{question.explanation}</p><a href="https://www.youtube.com/results?search_query=matematika+darslari" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-blue-600">Video yechimni ko‘rish →</a></details>)}</div> : <p className="mt-6 text-center text-sm text-slate-500">Test yakunlangach xato savollar tushuntirishlari shu yerda saqlanadi.</p>}</section>
  </div>
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-500">{error}</span>}</label> }

import { useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiCheck, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi'
import { useUserStore } from '../store/useUserStore'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { BrandLogo } from './BrandLogo'

const OTP_LENGTH = 6

export function AuthGate() {
  const login = useUserStore((state) => state.login)
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState({ name: '', email: '', identifier: '' })
  const [loginStep, setLoginStep] = useState('identifier')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const otpRefs = useRef([])
  const { buttonRef, error, isConfigured, retry } = useGoogleAuth()

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setLoginStep('identifier')
    setOtp(Array(OTP_LENGTH).fill(''))
  }

  const submit = (event) => {
    event.preventDefault()
    if (mode === 'register') {
      login({ name: form.name, email: form.email })
    } else if (loginStep === 'identifier') {
      setLoginStep('otp')
      requestAnimationFrame(() => otpRefs.current[0]?.focus())
    } else if (otp.every(Boolean)) {
      login({ name: form.identifier.split('@')[0] || 'Foydalanuvchi', email: form.identifier })
    }
  }

  const updateOtp = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = digit
    setOtp(nextOtp)
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (event) => {
    event.preventDefault()
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('')
    if (!digits.length) return
    setOtp(Array.from({ length: OTP_LENGTH }, (_, index) => digits[index] || ''))
    otpRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus()
  }

  return <div className="fixed inset-0 z-[100] grid min-h-screen place-items-center overflow-y-auto bg-slate-950 p-4">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.18),transparent_38%)]"/>
    <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl dark:bg-slate-900 lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden bg-emerald-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-slate-950/90 shadow-lg"><BrandLogo className="h-11 w-11"/></span><div><b>Certificate Academy</b><p className="text-sm text-emerald-100">Milliy Sertifikat Tayyorgarlik Tizimi</p></div></div>
        <div><p className="text-sm font-bold uppercase tracking-[.25em] text-emerald-100">Milliy sertifikat</p><h1 className="mt-4 text-4xl font-black leading-tight">Bilimingizni aniq reja bilan mustahkamlang.</h1><p className="mt-4 max-w-md leading-7 text-emerald-50">Darsliklar, qisqa konspektlar, progress testlar va real imtihon simulyatsiyasi bir platformada.</p></div>
        <p className="text-sm text-emerald-100">Har bir natija saqlanadi va shaxsiy yo‘nalishingizni shakllantiradi.</p>
      </section>
      <section className="p-6 text-slate-950 dark:text-white sm:p-10">
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{[['register','Ro‘yxatdan o‘tish'],['login','Kirish']].map(([key,label])=><button type="button" key={key} onClick={()=>changeMode(key)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode===key?'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white':'text-slate-500'}`}>{label}</button>)}</div>
        <h2 className="mt-8 text-3xl font-black">{mode === 'register' ? 'Yangi hisob yaratish' : 'Hisobga kirish'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'login' && loginStep === 'otp' ? `Tasdiqlash kodi ${form.identifier} manziliga yuborildi.` : 'Davom etish orqali dars progressi ushbu qurilmada saqlanadi.'}</p>
        {isConfigured && loginStep === 'identifier' && <><div className="mt-6"><div ref={buttonRef} className="flex min-h-11 w-full justify-center"/>{error && <div role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-center text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300"><p>{error}</p><button type="button" onClick={retry} className="mt-2 font-bold underline">Qayta urinish</button></div>}</div><div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>yoki<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/></div></>}
        <form onSubmit={submit} className={`${isConfigured && loginStep === 'identifier' ? '' : 'mt-6'} space-y-4`}>
          {mode === 'register' ? <>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Ismingiz</span><span className="relative block"><FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="form-input pl-11" placeholder="Masalan: Muslima"/></span></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Email</span><span className="relative block"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="form-input pl-11" placeholder="name@example.com"/></span></label>
          </> : <>
            {loginStep === 'identifier' && <label className="block"><span className="mb-2 block text-sm font-semibold">Telefon yoki Email</span><span className="relative block"><FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input required autoComplete="username" value={form.identifier} onChange={e=>setForm({...form,identifier:e.target.value})} className="form-input pl-11" placeholder="+998 90 123 45 67 yoki email"/></span></label>}
            {loginStep === 'otp' && <div>
              <div className="mb-3 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-semibold"><FiLock className="text-emerald-500"/>6 xonali PIN-kod</span><button type="button" onClick={()=>setLoginStep('identifier')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">O‘zgartirish</button></div>
              <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => <input key={index} ref={element=>{otpRefs.current[index]=element}} value={digit} onChange={event=>updateOtp(index,event.target.value)} onKeyDown={event=>handleOtpKeyDown(index,event)} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1} aria-label={`PIN-kodning ${index + 1}-raqami`} className="aspect-square min-w-0 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"/>) }
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><span className="flex items-center gap-2"><FiCheck/>Kod 2 daqiqa amal qiladi</span><button type="button" className="font-bold hover:underline">Qayta yuborish</button></div>
            </div>}
          </>}
          <button disabled={mode === 'login' && loginStep === 'otp' && !otp.every(Boolean)} className="btn-primary w-full disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700">{mode === 'login' && loginStep === 'otp' ? 'Tasdiqlash va kirish' : 'Davom etish'} <FiArrowRight/></button>
          {mode === 'login' && loginStep === 'otp' && <button type="button" onClick={()=>setLoginStep('identifier')} className="flex w-full items-center justify-center gap-2 py-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:hover:text-white"><FiArrowLeft/> Ortga qaytish</button>}
        </form>
      </section>
    </div>
  </div>
}

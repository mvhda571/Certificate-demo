import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FiArrowLeft, FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiMail, FiMoon, FiSun, FiUser } from 'react-icons/fi'
import { useUserStore } from '../store/useUserStore'
import { useThemeStore } from '../store/themeStore'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { registerAccount, saveOnboarding, verifyAccount } from '../utils/localAccounts'
import { BrandLogo } from './BrandLogo'
import { LanguageSwitcher } from './LanguageSwitcher'

const REASONS = [['university', 'reasonUniversity'], ['bonus', 'reasonBonus'], ['check', 'reasonCheck'], ['career', 'reasonCareer'], ['other', 'reasonOther']]
const LEVELS = [['A+', 'levelTop'], ['A', 'levelHigh'], ['B+', 'levelMid'], ['B', 'levelMid'], ['C+', 'levelBase'], ['C', 'levelBase']]
const LANGUAGE_LEVELS = ['B1', 'B2', 'C1']
const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '' }
const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.22 } }

function AuthTopBar() {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode } = useThemeStore()
  return <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
    <div className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-slate-950 shadow"><BrandLogo className="h-9 w-9"/></span><b className="hidden text-slate-900 dark:text-white sm:block">Certificate Academy</b></div>
    <div className="flex items-center gap-2">
      <LanguageSwitcher/>
      <button type="button" onClick={toggleDarkMode} aria-label={darkMode ? t('auth.themeLight') : t('auth.themeDark')} title={darkMode ? t('auth.themeLight') : t('auth.themeDark')} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
        {darkMode ? <FiSun className="h-4 w-4 text-amber-400"/> : <FiMoon className="h-4 w-4"/>}<span className="hidden sm:inline">{darkMode ? t('auth.themeLight') : t('auth.themeDark')}</span>
      </button>
    </div>
  </header>
}

function Field({ label, icon: Icon, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><span className="relative block"><Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>{children}</span></label>
}

function AuthForm({ onSignedIn }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { buttonRef, error: googleError, isConfigured, retry } = useGoogleAuth()
  const update = (key) => (event) => { setForm({ ...form, [key]: event.target.value }); setError('') }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setForm((current) => ({ ...EMPTY_FORM, email: current.email }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (form.password.length < 6) return setError('errPassword')
    setLoading(true)
    const result = mode === 'register' ? await registerAccount(form) : await verifyAccount(form)
    setLoading(false)
    if (result.error) return setError(result.error)
    if (mode === 'register') {
      toast.success(t('auth.registered'))
      changeMode('login')
    } else {
      onSignedIn(result.account)
    }
  }

  const passwordToggleLabel = showPassword ? t('auth.hidePassword') : t('auth.showPassword')

  return <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 lg:grid-cols-[1.05fr_.95fr]">
    <section className="hidden bg-emerald-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-slate-950/90 shadow-lg"><BrandLogo className="h-11 w-11"/></span><div><b>Certificate Academy</b><p className="text-sm text-emerald-100">{t('auth.brandTagline')}</p></div></div>
      <div><p className="text-sm font-bold uppercase tracking-[.25em] text-emerald-100">{t('auth.heroEyebrow')}</p><h1 className="mt-4 text-4xl font-black leading-tight">{t('auth.heroTitle')}</h1><p className="mt-4 max-w-md leading-7 text-emerald-50">{t('auth.heroText')}</p></div>
      <p className="text-sm text-emerald-100">{t('auth.heroFooter')}</p>
    </section>
    <section className="p-6 text-slate-950 dark:text-white sm:p-10">
      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{[['register', 'signUp'], ['login', 'signIn']].map(([key, label]) => <button type="button" key={key} onClick={() => changeMode(key)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === key ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}>{t(`auth.${label}`)}</button>)}</div>
      <AnimatePresence mode="wait">
        <motion.div key={mode} {...fade}>
          <h2 className="mt-8 text-3xl font-black">{mode === 'register' ? t('auth.signUpTitle') : t('auth.signInTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'register' ? t('auth.signUpHint') : t('auth.signInHint')}</p>
          {isConfigured && <><div className="mt-6"><div ref={buttonRef} className="flex min-h-11 w-full justify-center"/>{googleError && <div role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-center text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300"><p>{googleError}</p><button type="button" onClick={retry} className="mt-2 font-bold underline">{t('auth.retry')}</button></div>}</div><div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>{t('auth.or')}<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/></div></>}
          <form onSubmit={submit} className={`${isConfigured ? '' : 'mt-6'} space-y-4`}>
            {mode === 'register' && <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('auth.firstName')} icon={FiUser}><input required autoComplete="given-name" value={form.firstName} onChange={update('firstName')} className="form-input pl-11" placeholder={t('auth.firstNamePh')}/></Field>
              <Field label={t('auth.lastName')} icon={FiUser}><input required autoComplete="family-name" value={form.lastName} onChange={update('lastName')} className="form-input pl-11" placeholder={t('auth.lastNamePh')}/></Field>
            </div>}
            <Field label={t('auth.email')} icon={FiMail}><input required type="email" autoComplete="email" value={form.email} onChange={update('email')} className="form-input pl-11" placeholder="name@example.com"/></Field>
            <Field label={t('auth.password')} icon={FiLock}>
              <input required type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={update('password')} className="form-input px-11" placeholder={t('auth.passwordPh')}/>
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={passwordToggleLabel} title={passwordToggleLabel} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-white">{showPassword ? <FiEyeOff/> : <FiEye/>}</button>
            </Field>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{t(`auth.${error}`)}</p>}
            <button disabled={loading} className="btn-primary w-full disabled:cursor-wait disabled:opacity-70">{mode === 'register' ? t('auth.signUpButton') : t('auth.signInButton')} <FiArrowRight/></button>
            <p className="text-center text-sm text-slate-500">{mode === 'register' ? t('auth.haveAccount') : t('auth.noAccount')} <button type="button" onClick={() => changeMode(mode === 'register' ? 'login' : 'register')} className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">{mode === 'register' ? t('auth.signIn') : t('auth.signUp')}</button></p>
          </form>
        </motion.div>
      </AnimatePresence>
    </section>
  </div>
}

function ChoiceButton({ selected, onClick, children }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}>
    {children}<span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{selected && <FiCheck className="h-3 w-3"/>}</span>
  </button>
}

function LevelButton({ value, hint, selected, onClick }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`rounded-2xl border-2 p-3 text-center transition ${selected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}>
    <b className={`block text-2xl font-black ${selected ? 'text-emerald-600 dark:text-emerald-300' : ''}`}>{value}</b>{hint && <span className="mt-1 block text-[11px] leading-4 text-slate-500">{hint}</span>}
  </button>
}

function Onboarding({ name, onComplete }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [reason, setReason] = useState('')
  const [reasonNote, setReasonNote] = useState('')
  const [level, setLevel] = useState('')
  const canContinue = step === 0 ? reason && (reason !== 'other' || reasonNote.trim()) : Boolean(level)

  const next = () => {
    if (!canContinue) return
    if (step === 0) setStep(1)
    else onComplete({ prepReason: reason, prepReasonNote: reason === 'other' ? reasonNote.trim() : '', targetGrade: level })
  }

  return <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white sm:p-10">
    <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500"><span>{name} 👋</span><span>{t('auth.step', { current: step + 1, total: 2 })}</span></div>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${(step + 1) * 50}%` }}/></div>
    <AnimatePresence mode="wait">
      <motion.div key={step} {...fade}>
        <h2 className="mt-8 text-2xl font-black leading-tight sm:text-3xl">{step === 0 ? t('auth.q1Title') : t('auth.q2Title')}</h2>
        <p className="mt-2 text-sm text-slate-500">{step === 0 ? t('auth.q1Hint') : t('auth.q2Hint')}</p>
        {step === 0 ? <div className="mt-6 space-y-3">
          {REASONS.map(([key, label]) => <ChoiceButton key={key} selected={reason === key} onClick={() => setReason(key)}>{t(`auth.${label}`)}</ChoiceButton>)}
          {reason === 'other' && <textarea autoFocus rows={3} value={reasonNote} onChange={(event) => setReasonNote(event.target.value)} className="form-input resize-none" placeholder={t('auth.reasonOtherPh')}/>}
        </div> : <div className="mt-6">
          <div className="grid grid-cols-3 gap-3">{LEVELS.map(([value, hint]) => <LevelButton key={value} value={value} hint={t(`auth.${hint}`)} selected={level === value} onClick={() => setLevel(value)}/>)}</div>
          <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">{t('auth.languageLevels')}</p>
          <div className="grid grid-cols-3 gap-3">{LANGUAGE_LEVELS.map((value) => <LevelButton key={value} value={value} selected={level === value} onClick={() => setLevel(value)}/>)}</div>
        </div>}
      </motion.div>
    </AnimatePresence>
    <div className="mt-8 flex gap-3">
      {step === 1 && <button type="button" onClick={() => setStep(0)} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><FiArrowLeft/> {t('auth.back')}</button>}
      <button type="button" onClick={next} disabled={!canContinue} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700">{step === 0 ? t('auth.next') : t('auth.finish')} <FiArrowRight/></button>
    </div>
  </div>
}

function Welcome({ account, returning, onStart }) {
  const { t } = useTranslation()
  return <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-8 text-center text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white sm:p-12">
    <motion.div initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-4xl dark:bg-emerald-500/15">🎉</motion.div>
    <h2 className="mt-6 text-3xl font-black">{t('auth.welcomeTitle', { name: account.firstName })}</h2>
    <p className="mt-3 leading-7 text-slate-500 dark:text-slate-300">{returning ? t('auth.welcomeBack') : t('auth.welcomeText', { level: account.targetGrade })}</p>
    {account.targetGrade && <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{t('auth.yourGoal')}: {account.targetGrade}</div>}
    <button type="button" onClick={onStart} autoFocus className="btn-primary mt-8 w-full">{t('auth.start')} <FiArrowRight/></button>
  </div>
}

export function AuthGate() {
  const login = useUserStore((state) => state.login)
  const [stage, setStage] = useState('auth')
  const [account, setAccount] = useState(null)
  const [returning, setReturning] = useState(false)

  const handleSignedIn = (signedInAccount) => {
    setAccount(signedInAccount)
    setReturning(signedInAccount.onboarded)
    setStage(signedInAccount.onboarded ? 'welcome' : 'onboarding')
  }

  const handleOnboarded = (answers) => {
    setAccount(saveOnboarding(account.email, answers) || { ...account, ...answers })
    setStage('welcome')
  }

  const enterApp = () => {
    const { firstName, lastName, email, prepReason, prepReasonNote, targetGrade } = account
    login({ name: `${firstName} ${lastName}`.trim(), email, firstName, lastName, prepReason, prepReasonNote, ...(targetGrade && { targetGrade }) })
  }

  return <div className="fixed inset-0 z-[100] flex min-h-screen flex-col overflow-y-auto bg-slate-100 transition-colors dark:bg-slate-950">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.15),transparent_38%)]"/>
    <AuthTopBar/>
    <main className="relative grid flex-1 place-items-center px-4 pb-8">
      <AnimatePresence mode="wait">
        <motion.div key={stage} {...fade} className="flex w-full justify-center">
          {stage === 'auth' && <AuthForm onSignedIn={handleSignedIn}/>}
          {stage === 'onboarding' && <Onboarding name={account.firstName} onComplete={handleOnboarded}/>}
          {stage === 'welcome' && <Welcome account={account} returning={returning} onStart={enterApp}/>}
        </motion.div>
      </AnimatePresence>
    </main>
  </div>
}

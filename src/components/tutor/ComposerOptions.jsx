import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { FiCheck, FiPlus } from 'react-icons/fi'
import { TUTOR_SUBJECTS } from '../../utils/tutorSubjects'

function useIsDesktop() {
  const query = '(min-width: 640px)'
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return matches
}

// "+" menyusi: fan tanlash va internetdan izlash. Kompyuterda popover, telefonda pastdan chiqadigan sheet.
const actionClass = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 outline-none transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800'

export function ComposerOptions({ subject, webSearch, onSubjectChange, onWebSearchChange, onPickImages, imagesFull, onStartSpeaking, disabled }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const isDesktop = useIsDesktop()
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return undefined
    const items = () => [...(panelRef.current?.querySelectorAll('[data-menu-item]:not(:disabled)') || [])]
    // Ochilganda tanlangan elementga fokus.
    const selected = items().find((item) => item.getAttribute('aria-checked') === 'true') || items()[0]
    selected?.focus()

    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      const list = items()
      const index = list.indexOf(document.activeElement)
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        list[(index + step + list.length) % list.length]?.focus()
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        list[event.key === 'Home' ? 0 : list.length - 1]?.focus()
      } else if (event.key === 'Tab') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const menu = (
    <div ref={panelRef} role="menu" aria-label={t('tutor.options')} className="p-2">
      <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('tutor.subjectLabel')}</p>
      <div className="grid gap-0.5">
        {TUTOR_SUBJECTS.map(([id, emoji]) => (
          <button
            key={id}
            type="button"
            role="menuitemradio"
            aria-checked={subject === id}
            data-menu-item
            onClick={() => { onSubjectChange(id); close() }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm outline-none transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800 ${subject === id ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}
          >
            <span aria-hidden="true" className="w-5 text-center">{emoji}</span>
            <span className="flex-1">{t(`tutor.subjects.${id}`)}</span>
            {subject === id && <FiCheck aria-hidden="true" className="h-4 w-4" />}
          </button>
        ))}
      </div>
      <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />
      <button
        type="button"
        role="menuitem"
        data-menu-item
        disabled={imagesFull}
        onClick={() => { close(false); onPickImages() }}
        className={actionClass}
      >
        <span aria-hidden="true" className="w-5 text-center">🖼️</span>
        <span className="flex-1">
          <span className="block font-medium">{t('tutor.images.add')}</span>
          <span className="block text-xs text-slate-400">{imagesFull ? t('tutor.images.limit') : t('tutor.images.addHint')}</span>
        </span>
      </button>
      <button
        type="button"
        role="menuitem"
        data-menu-item
        onClick={() => { close(false); onStartSpeaking() }}
        className={actionClass}
      >
        <span aria-hidden="true" className="w-5 text-center">🎤</span>
        <span className="flex-1">
          <span className="block font-medium">{t('tutor.speaking.start')}</span>
          <span className="block text-xs text-slate-400">{t('tutor.speaking.startHint')}</span>
        </span>
      </button>
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={webSearch}
        data-menu-item
        onClick={() => onWebSearchChange(!webSearch)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 outline-none transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
      >
        <span aria-hidden="true" className="w-5 text-center">🌐</span>
        <span className="flex-1">
          <span className="block font-medium">{t('tutor.internet')}</span>
          <span className="block text-xs text-slate-400">{t('tutor.internetHint')}</span>
        </span>
        <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition ${webSearch ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${webSearch ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </button>
    </div>
  )

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('tutor.options')}
        className={`grid h-10 w-10 place-items-center rounded-full border transition disabled:opacity-50 ${open ? 'rotate-45 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
      >
        <FiPlus aria-hidden="true" className="h-5 w-5" />
      </button>

      {open && isDesktop && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {menu}
        </div>
      )}

      {open && !isDesktop && createPortal(
        <div className="fixed inset-0 z-[1100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" aria-hidden="true" />
          <div className="relative max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
            {menu}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

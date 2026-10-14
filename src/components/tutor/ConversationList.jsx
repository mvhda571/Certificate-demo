import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheck, FiEdit2, FiEdit3, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import { subjectEmoji } from '../../utils/tutorSubjects'

const DAY = 24 * 60 * 60 * 1000

function groupKey(timestamp, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (timestamp >= startOfToday) return 'today'
  if (timestamp >= startOfToday - DAY) return 'yesterday'
  if (timestamp >= startOfToday - 7 * DAY) return 'week'
  return 'earlier'
}

function ConversationItem({ conversation, active, onSelect, onRename, onDelete }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('view')
  const [title, setTitle] = useState(conversation.title)

  if (mode === 'rename') {
    const save = () => {
      if (title.trim()) onRename(conversation.id, title)
      setMode('view')
    }
    return (
      <form
        className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
        onSubmit={(event) => { event.preventDefault(); save() }}
      >
        <input
          autoFocus
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setTitle(conversation.title); setMode('view') } }}
          aria-label={t('tutor.renameLabel')}
          className="min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-emerald-500/40 dark:bg-slate-900"
        />
        <button type="submit" aria-label={t('tutor.save')} className="grid h-8 w-8 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><FiCheck aria-hidden="true" /></button>
        <button type="button" aria-label={t('tutor.cancel')} onClick={() => { setTitle(conversation.title); setMode('view') }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><FiX aria-hidden="true" /></button>
      </form>
    )
  }

  if (mode === 'delete') {
    return (
      <div role="group" aria-label={t('tutor.deleteConfirm')} className="rounded-xl border border-red-200 bg-red-50 p-2.5 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-xs font-medium text-red-700 dark:text-red-300">{t('tutor.deleteConfirm')}</p>
        <p className="mt-0.5 truncate text-xs text-red-600/80 dark:text-red-300/70">{conversation.title}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" autoFocus onClick={() => onDelete(conversation.id)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600">{t('tutor.delete')}</button>
          <button type="button" onClick={() => setMode('view')} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">{t('tutor.cancel')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex min-w-0 items-center gap-1 rounded-xl pr-1 transition ${active ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        aria-current={active ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <span aria-hidden="true" className="text-sm">{conversation.mode === 'ielts-speaking' ? '🎤' : subjectEmoji(conversation.subject)}</span>
        <span className={`truncate text-sm ${active ? 'font-semibold text-emerald-800 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-200'}`}>{conversation.title}</span>
      </button>
      <span className="flex shrink-0 opacity-100 transition lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <button type="button" onClick={() => { setTitle(conversation.title); setMode('rename') }} aria-label={t('tutor.rename')} title={t('tutor.rename')} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"><FiEdit2 aria-hidden="true" className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => setMode('delete')} aria-label={t('tutor.delete')} title={t('tutor.delete')} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-red-500 dark:hover:bg-slate-700"><FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" /></button>
      </span>
    </div>
  )
}

export function ConversationList({ conversations, activeId, onSelect, onRename, onDelete, onNew, onClose }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const filtered = conversations
      .filter((conversation) => !needle || conversation.title.toLocaleLowerCase().includes(needle))
      .sort((a, b) => b.updatedAt - a.updatedAt)
    const buckets = { today: [], yesterday: [], week: [], earlier: [] }
    for (const conversation of filtered) buckets[groupKey(conversation.updatedAt)].push(conversation)
    return Object.entries(buckets).filter(([, items]) => items.length)
  }, [conversations, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('tutor.conversations')}</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onNew} aria-label={t('tutor.newChat')} title={t('tutor.newChat')} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><FiEdit3 aria-hidden="true" className="h-4 w-4" /></button>
          {onClose && <button type="button" onClick={onClose} aria-label={t('tutor.close')} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><FiX aria-hidden="true" className="h-4 w-4" /></button>}
        </div>
      </div>
      <div className="px-3 pb-2">
        <label className="relative block">
          <span className="sr-only">{t('tutor.searchConversations')}</span>
          <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('tutor.searchConversations')}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
      </div>
      <nav aria-label={t('tutor.conversations')} className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!conversations.length && <p className="px-3 py-6 text-center text-sm text-slate-400">{t('tutor.noConversations')}</p>}
        {!!conversations.length && !groups.length && <p className="px-3 py-6 text-center text-sm text-slate-400">{t('tutor.noResults')}</p>}
        {groups.map(([key, items]) => (
          <section key={key} className="mt-2">
            <h3 className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t(`tutor.groups.${key}`)}</h3>
            <ul className="flex flex-col gap-0.5">
              {items.map((conversation) => (
                <li key={conversation.id}>
                  <ConversationItem
                    conversation={conversation}
                    active={conversation.id === activeId}
                    onSelect={onSelect}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  )
}

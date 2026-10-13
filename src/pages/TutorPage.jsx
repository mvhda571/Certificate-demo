import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiAlertTriangle,
  FiBookOpen,
  FiCheck,
  FiCopy,
  FiEdit3,
  FiGlobe,
  FiLoader,
  FiMessageCircle,
  FiMic,
  FiRotateCcw,
  FiSend,
  FiSquare,
  FiX,
} from 'react-icons/fi'
import { MdHistory } from 'react-icons/md'
import { createId, createMessage, setMessageImages, useTutorAttachments, useTutorStore } from '../store/useTutorStore'
import { ComposerOptions } from '../components/tutor/ComposerOptions'
import { ConversationList } from '../components/tutor/ConversationList'
import { ListenButton } from '../components/tutor/ListenButton'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { compressImage, ImageCompressError } from '../utils/imageCompress'
import { stopSpeaking } from '../utils/speech'
import { subjectEmoji } from '../utils/tutorSubjects'
import { normalizeTutorMarkdown } from '../utils/tutorMarkdown'
import 'katex/dist/katex.min.css'
import './TutorPage.css'

const MAX_LENGTH = 4000
const HISTORY_LIMIT = 12
const FLUSH_MS = 50
const MAX_IMAGES = 3
const MAX_RECORD_SECONDS = 60
const SPEAKING_MODE = 'ielts-speaking'
const EMPTY_MESSAGES = []

const formatSeconds = (value) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`

// Sahifa balandligi = ekran − (yuqoridagi header va hokazo). Transformlarni hisobga olmaslik uchun offsetTop ishlatiladi.
function useTopOffset(ref) {
  const [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      let offset = 0
      for (let node = ref.current; node; node = node.offsetParent) offset += node.offsetTop
      setTop(offset)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [ref])
  return top
}

function MarkdownLink({ children, href }) {
  const text = Array.isArray(children) ? children.join('') : String(children ?? '')
  const isCitation = /^\[\d+\]$/.test(text)
  return (
    <a href={href} target="_blank" rel="noreferrer" className={isCitation ? 'citation-link' : undefined}>
      {isCitation ? text.slice(1, -1) : children}
    </a>
  )
}
const markdownComponents = { a: MarkdownLink }

const AssistantMarkdown = memo(function AssistantMarkdown({ content, webSources }) {
  const normalized = useMemo(() => normalizeTutorMarkdown(content, webSources), [content, webSources])
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
      {normalized}
    </ReactMarkdown>
  )
})

function UserMessage({ message }) {
  const { t } = useTranslation()
  const images = useTutorAttachments((state) => state.images[message.id])
  return (
    <article className="flex flex-col items-end gap-1.5">
      <h3 className="sr-only">{t('tutor.you')}</h3>
      {images?.length ? (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {images.map((src, index) => (
            <img key={src.slice(-32)} src={src} alt={t('tutor.images.alt', { index: index + 1 })} className="h-24 w-24 rounded-xl border border-slate-200 object-cover dark:border-slate-700 sm:h-28 sm:w-28" />
          ))}
        </div>
      ) : message.imageCount ? (
        <p className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
          <span aria-hidden="true">🖼️</span>{t('tutor.images.sentCount', { count: message.imageCount })}
        </p>
      ) : null}
      {message.content && (
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-emerald-600 px-4 py-2.5 text-sm leading-relaxed text-white">{message.content}</p>
      )}
    </article>
  )
}

function AssistantMessage({ message, onRetry, onCopy, copied }) {
  const { t } = useTranslation()
  const web = message.sources?.web || []
  const notes = message.sources?.notes || []
  const streaming = message.status === 'streaming'
  const searchFailed = message.status === 'done' && ['unavailable', 'unused'].includes(message.search)

  return (
    <article className="flex min-w-0 gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" aria-hidden="true">
        <FiBookOpen className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="sr-only">{t('tutor.ai')}</h3>
        {searchFailed && (
          <p className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <FiAlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t('tutor.searchUnavailable')}
          </p>
        )}
        <div className="markdown-body">
          {message.content
            ? <AssistantMarkdown content={message.content} webSources={web} />
            : streaming && (
              <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {message.searching
                  ? <><FiGlobe aria-hidden="true" className="h-4 w-4 animate-pulse text-emerald-500" />{t('tutor.searching')}</>
                  : <><span className="typing-indicator" aria-hidden="true"><i /><i /><i /></span>{t('tutor.thinking')}</>}
              </p>
            )}
          {streaming && message.content && <span className="stream-cursor" aria-hidden="true" />}
        </div>
        {message.error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{message.error}</p>}
        {message.status === 'stopped' && <p className="mt-2 text-xs text-slate-400">{t('tutor.stopped')}</p>}

        {!!web.length && (
          <div className="mt-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400"><FiGlobe aria-hidden="true" />{t('tutor.webSources')}</p>
            <ol className="flex flex-wrap gap-1.5">
              {web.map((source, index) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-300">
                    <b className="text-emerald-600 dark:text-emerald-400">{index + 1}</b>
                    <span className="truncate">{source.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
        {!!notes.length && (
          <div className="mt-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400"><FiBookOpen aria-hidden="true" />{t('tutor.notes')}</p>
            <ul className="flex flex-wrap gap-1.5">
              {notes.map((note) => (
                <li key={note.file || `${note.title}-${note.heading}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {note.title}
                  {note.fan && <span className="text-slate-400"> · {t('tutor.noteMeta', { fan: note.fan, sinf: note.sinf || '' })}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!streaming && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            {message.content && <ListenButton id={message.id} content={message.content} />}
            {message.content && (
              <button type="button" onClick={() => onCopy(message)} className="inline-flex items-center gap-1 rounded-md py-1 hover:text-slate-700 dark:hover:text-slate-200">
                {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                {copied ? t('tutor.copied') : t('tutor.copy')}
              </button>
            )}
            {message.status === 'error' && (
              <button type="button" onClick={() => onRetry(message.id)} className="inline-flex items-center gap-1 rounded-md py-1 font-semibold text-red-500 hover:text-red-600">
                <FiRotateCcw aria-hidden="true" />{t('tutor.retry')}
              </button>
            )}
            {message.model && <span className="ml-auto font-mono" title={t('tutor.model', { model: message.model })}>{message.model}</span>}
          </div>
        )}
      </div>
    </article>
  )
}

// Tarixdagi eski rasmli xabarlar: rasmlarning o'zi saqlanmaydi, model uchun izoh qoladi.
const imageHistoryNote = (count) => `[The student attached ${count} image(s) to this message earlier; the images are no longer available.]`

export function TutorPage() {
  const { t, i18n } = useTranslation()
  const conversations = useTutorStore((state) => state.conversations)
  const activeId = useTutorStore((state) => state.activeId)
  const draft = useTutorStore((state) => state.draft)
  const active = conversations.find((conversation) => conversation.id === activeId) || null
  const messages = active?.messages || EMPTY_MESSAGES
  const subject = active?.subject ?? draft.subject
  const webSearch = active?.webSearch ?? draft.webSearch
  const speakingMode = active?.mode === SPEAKING_MODE

  const [input, setInput] = useState('')
  const [streamingConversationId, setStreamingConversationId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [copiedId, setCopiedId] = useState('')
  const [pendingImages, setPendingImages] = useState([])
  const [preparingImages, setPreparingImages] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [composerError, setComposerError] = useState('')
  const streamRef = useRef(null)
  const transcribeAbortRef = useRef(null)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const lastCountRef = useRef(0)
  const topOffset = useTopOffset(rootRef)
  const sending = Boolean(streamingConversationId)
  const sendingHere = sending && streamingConversationId === activeId

  const recorder = useVoiceRecorder({ maxSeconds: MAX_RECORD_SECONDS, onAudio: transcribeAudio })
  const visibleError = composerError || (recorder.error ? t(`tutor.voice.${recorder.error}`) : '')
  const dismissError = () => { setComposerError(''); recorder.clearError() }

  const abortStream = useCallback(() => {
    streamRef.current?.controller.abort()
    streamRef.current = null
    setStreamingConversationId(null)
  }, [])
  useEffect(() => () => {
    streamRef.current?.controller.abort()
    transcribeAbortRef.current?.abort()
    stopSpeaking()
  }, [])

  // Yangi xabar qo'shilsa — pastga; stream paytida faqat foydalanuvchi pastda bo'lsa ergashamiz.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const countChanged = messages.length !== lastCountRef.current
    lastCountRef.current = messages.length
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 160
    if (countChanged || nearBottom) list.scrollTo({ top: list.scrollHeight, behavior: countChanged ? 'smooth' : 'auto' })
  }, [messages])

  useLayoutEffect(() => {
    lastCountRef.current = 0
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [activeId])

  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  function resizeTextarea() {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }

  // Ovoz → /api/transcribe (Whisper) → matn inputga tushadi, o'quvchi tekshirib yuboradi.
  async function transcribeAudio(blob) {
    setTranscribing(true)
    setComposerError('')
    const controller = new AbortController()
    transcribeAbortRef.current = controller
    try {
      const extension = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'
      const form = new FormData()
      form.append('file', blob, `voice.${extension}`)
      // IELTS Speaking javoblari doim ingliz tilida.
      form.append('language', speakingMode ? 'en' : (i18n.language || 'uz').slice(0, 2))
      const response = await fetch('/api/transcribe', { method: 'POST', body: form, signal: controller.signal })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : t('tutor.voice.failed'))
      const text = String(data.text || '').trim()
      if (!text) {
        setComposerError(t('tutor.voice.empty'))
        return
      }
      setInput((previous) => (previous.trim() ? `${previous.trimEnd()} ${text}` : text).slice(0, MAX_LENGTH))
      requestAnimationFrame(() => {
        resizeTextarea()
        textareaRef.current?.focus()
      })
    } catch (error) {
      if (error.name !== 'AbortError') setComposerError(error.message || t('tutor.voice.failed'))
    } finally {
      if (transcribeAbortRef.current === controller) transcribeAbortRef.current = null
      setTranscribing(false)
    }
  }

  // Rasmlar brauzerda siqiladi (≤1600px JPEG) va yuborilguncha faqat xotirada turadi.
  async function addImageFiles(fileList) {
    const files = [...(fileList || [])].filter(Boolean)
    if (!files.length) return
    setComposerError('')
    const free = MAX_IMAGES - pendingImages.length - preparingImages
    if (free <= 0) {
      setComposerError(t('tutor.images.limit'))
      return
    }
    if (files.length > free) setComposerError(t('tutor.images.limit'))
    const accepted = files.slice(0, free)
    setPreparingImages((count) => count + accepted.length)
    for (const file of accepted) {
      try {
        const { dataUrl } = await compressImage(file)
        setPendingImages((list) => (list.length >= MAX_IMAGES ? list : [...list, { id: createId(), dataUrl }]))
      } catch (error) {
        setComposerError(t(`tutor.images.${error instanceof ImageCompressError ? error.code : 'failed'}`))
      } finally {
        setPreparingImages((count) => count - 1)
      }
    }
  }

  async function sendMessage(text = input, retryMessageId = null, overrides = null) {
    if (streamRef.current || preparingImages) return
    const store = useTutorStore.getState()
    let conversationId = store.activeId

    if (retryMessageId) {
      store.removeMessage(conversationId, retryMessageId)
    } else {
      const content = text.trim()
      const images = overrides ? [] : pendingImages.map((image) => image.dataUrl)
      if (!content && !images.length) return
      const userMessage = createMessage({ role: 'user', content, ...(images.length ? { imageCount: images.length } : {}) })
      if (images.length) setMessageImages(userMessage.id, images)
      if (conversationId) store.addMessage(conversationId, userMessage)
      else conversationId = store.createConversation(userMessage, { ...overrides, ...(!content ? { title: t('tutor.images.title') } : {}) })
      setInput('')
      setPendingImages([])
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    const conversation = useTutorStore.getState().conversations.find((item) => item.id === conversationId)
    if (!conversation) return
    const recent = conversation.messages
      .filter((message) => message.role === 'user' || (message.content && message.status !== 'error'))
      .slice(-HISTORY_LIMIT)
    const lastUser = recent.at(-1)
    if (lastUser?.role !== 'user') return
    const attachments = useTutorAttachments.getState().images
    const history = recent.map((message) => {
      if (message.role !== 'user' || !message.imageCount) return { role: message.role, content: message.content }
      const urls = message === lastUser ? attachments[message.id] : null
      if (urls?.length) return { role: 'user', content: message.content, images: urls }
      return { role: 'user', content: [message.content, imageHistoryNote(message.imageCount)].filter(Boolean).join('\n') }
    })

    const { addMessage, updateMessage } = useTutorStore.getState()
    const assistantMessage = createMessage({
      role: 'assistant',
      content: '',
      status: 'streaming',
      search: conversation.webSearch && conversation.mode !== SPEAKING_MODE ? 'pending' : 'off',
      sources: { web: [], notes: [] },
    })
    const assistantId = assistantMessage.id
    addMessage(conversationId, assistantMessage)
    const update = (updates) => updateMessage(conversationId, assistantId, updates)

    const controller = new AbortController()
    streamRef.current = { controller, conversationId }
    setStreamingConversationId(conversationId)

    // Delta'larni yig'ib, ~50ms'da bir marta yozamiz (localStorage har tokenda qayta yozilmasin).
    let pendingText = ''
    let flushTimer = null
    const flush = () => {
      clearTimeout(flushTimer)
      flushTimer = null
      if (!pendingText) return
      const chunk = pendingText
      pendingText = ''
      update((message) => ({ content: message.content + chunk }))
    }

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({
          messages: history,
          subject: conversation.subject,
          webSearch: conversation.webSearch,
          mode: conversation.mode || undefined,
          language: (i18n.language || 'uz').slice(0, 2),
        }),
        signal: controller.signal,
      })
      if (!response.ok) {
        let message = t('tutor.serverError', { status: response.status })
        try {
          const errorBody = await response.json()
          if (typeof errorBody.error === 'string') message = errorBody.error
        } catch {
          // Javob JSON bo'lmasa, HTTP status bilan qolamiz.
        }
        throw new Error(message)
      }
      if (!response.body) throw new Error(t('tutor.error'))

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const handleEvent = (event) => {
        if (event.type === 'delta') {
          pendingText += event.text
          if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_MS)
        } else if (event.type === 'status' && event.status === 'searching') {
          update({ searching: true })
        } else if (event.type === 'sources') {
          update({ sources: { web: event.web || [], notes: event.notes || [] }, search: event.search })
        } else if (event.type === 'done') {
          flush()
          update({ status: 'done', searching: false, model: event.model, fallback: Boolean(event.fallback) })
        } else if (event.type === 'error') {
          throw new Error(event.message || t('tutor.error'))
        }
      }
      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
        const lines = buffer.split(/\r?\n/)
        buffer = done ? '' : lines.pop() || ''
        for (const line of lines) if (line.trim()) handleEvent(JSON.parse(line))
        if (done) break
      }
      flush()
    } catch (error) {
      flush()
      if (error.name === 'AbortError') update({ status: 'stopped', searching: false })
      else update({ status: 'error', searching: false, error: error.message || t('tutor.error') })
    } finally {
      // To'xtatilgan eski oqim yangi boshlangan oqimni o'chirib yubormasin.
      if (streamRef.current?.controller === controller) {
        streamRef.current = null
        setStreamingConversationId(null)
      }
    }
  }

  function retry(errorMessageId) {
    sendMessage('', errorMessageId)
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(message.id)
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch {
      // Clipboard ruxsati bo'lmasa, jim o'tamiz.
    }
  }

  // Boshqa suhbatga o'tilganda oqim to'xtatiladi — javob faqat o'z suhbatiga yoziladi.
  function selectConversation(id) {
    if (streamRef.current && streamRef.current.conversationId !== id) abortStream()
    stopSpeaking()
    useTutorStore.getState().selectConversation(id)
    setDrawerOpen(false)
  }

  function startNewConversation() {
    abortStream()
    stopSpeaking()
    useTutorStore.getState().startNewConversation()
    setDrawerOpen(false)
    window.setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function startSpeakingPractice() {
    abortStream()
    stopSpeaking()
    useTutorStore.getState().startNewConversation()
    setDrawerOpen(false)
    sendMessage(t('tutor.speaking.kickoff'), null, { mode: SPEAKING_MODE, subject: 'ielts', webSearch: false, title: t('tutor.speaking.title') })
  }

  function deleteConversation(id) {
    if (streamRef.current?.conversationId === id) abortStream()
    stopSpeaking()
    useTutorStore.getState().deleteConversation(id)
  }

  const updateSettings = (settings) => useTutorStore.getState().updateSettings(settings)
  const exampleQuestions = t('tutor.examples', { returnObjects: true })
  const listProps = {
    conversations,
    activeId,
    onSelect: selectConversation,
    onRename: (id, title) => useTutorStore.getState().renameConversation(id, title),
    onDelete: deleteConversation,
    onNew: startNewConversation,
  }
  const busyComposer = recorder.recording || transcribing
  const canSend = (input.trim() || pendingImages.length) && !sending && !preparingImages && !busyComposer
  const chipClass = 'inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-medium'
  const chipButtonClass = 'grid h-5 w-5 place-items-center rounded-full'

  return (
    <div ref={rootRef} className="tutor-shell flex gap-4" style={{ '--tutor-top': `${topOffset}px` }}>
      <aside className="hidden w-72 shrink-0 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)] dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
        <ConversationList {...listProps} />
      </aside>

      <section aria-label={t('tutor.nav')} className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)] dark:border-slate-800 dark:bg-slate-900">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/70 px-2 dark:border-slate-800 sm:px-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('tutor.conversations')}
            aria-expanded={drawerOpen}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <MdHistory aria-hidden="true" className="h-5 w-5" />
            <span className="hidden min-[400px]:inline">{t('tutor.conversations')}</span>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-slate-900 dark:text-white lg:px-2 lg:text-left">
            {active?.title || t('tutor.newConversation')}
          </h1>
          <button
            type="button"
            onClick={startNewConversation}
            aria-label={t('tutor.newChat')}
            title={t('tutor.newChat')}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FiEdit3 aria-hidden="true" className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">{t('tutor.newChat')}</span>
          </button>
        </header>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-4 py-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" aria-hidden="true">
                <FiMessageCircle className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{t('tutor.examplesTitle')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('tutor.empty')}</p>
              <div className="mt-6 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                    disabled={sending}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/5"
                  >
                    <span>{question}</span>
                    <FiSend aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-500 transition group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-3 py-5 sm:px-6" aria-live="polite">
              {messages.map((message) => (message.role === 'user' ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  onRetry={retry}
                  onCopy={copyMessage}
                  copied={copiedId === message.id}
                />
              )))}
            </div>
          )}
        </div>

        <form
          className="shrink-0 border-t border-slate-200/70 bg-white px-2 pb-2 pt-2 dark:border-slate-800 dark:bg-slate-900 sm:px-4 sm:pb-3"
          onSubmit={(event) => { event.preventDefault(); if (canSend) sendMessage() }}
        >
          <div className="mx-auto max-w-3xl">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => { addImageFiles(event.target.files); event.target.value = '' }}
            />
            {visibleError && (
              <p role="alert" className="mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                <FiAlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{visibleError}</span>
                <button type="button" onClick={dismissError} aria-label={t('tutor.close')} className="-m-1 grid h-6 w-6 place-items-center rounded-full hover:bg-red-100 dark:hover:bg-red-500/20"><FiX aria-hidden="true" className="h-3.5 w-3.5" /></button>
              </p>
            )}
            {(subject !== 'general' || webSearch || speakingMode) && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {speakingMode && (
                  <span className={`${chipClass} bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300`}>
                    <span aria-hidden="true">🎤</span>{t('tutor.speaking.chip')}
                    <button type="button" onClick={() => updateSettings({ mode: null })} aria-label={t('tutor.removeChip', { label: t('tutor.speaking.chip') })} className={`${chipButtonClass} text-violet-400 hover:bg-violet-100 hover:text-violet-800 dark:hover:bg-violet-500/20 dark:hover:text-violet-200`}><FiX aria-hidden="true" className="h-3 w-3" /></button>
                  </span>
                )}
                {subject !== 'general' && !speakingMode && (
                  <span className={`${chipClass} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`}>
                    <span aria-hidden="true">{subjectEmoji(subject)}</span>{t(`tutor.subjects.${subject}`)}
                    <button type="button" onClick={() => updateSettings({ subject: 'general' })} aria-label={t('tutor.removeChip', { label: t(`tutor.subjects.${subject}`) })} className={`${chipButtonClass} text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200`}><FiX aria-hidden="true" className="h-3 w-3" /></button>
                  </span>
                )}
                {webSearch && !speakingMode && (
                  <span className={`${chipClass} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300`}>
                    <span aria-hidden="true">🌐</span>{t('tutor.internetChip')}
                    <button type="button" onClick={() => updateSettings({ webSearch: false })} aria-label={t('tutor.removeChip', { label: t('tutor.internetChip') })} className={`${chipButtonClass} text-emerald-500 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200`}><FiX aria-hidden="true" className="h-3 w-3" /></button>
                  </span>
                )}
                {speakingMode && <span className="self-center text-[11px] text-slate-400">{t('tutor.speaking.hint')}</span>}
              </div>
            )}
            {(pendingImages.length > 0 || preparingImages > 0) && (
              <div className="mb-2 flex gap-2" aria-label={t('tutor.images.pending')}>
                {pendingImages.map((image, index) => (
                  <span key={image.id} className="relative">
                    <img src={image.dataUrl} alt={t('tutor.images.alt', { index: index + 1 })} className="h-16 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
                    <button
                      type="button"
                      onClick={() => setPendingImages((list) => list.filter((item) => item.id !== image.id))}
                      aria-label={t('tutor.images.remove', { index: index + 1 })}
                      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-white shadow ring-2 ring-white dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-900"
                    >
                      <FiX aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                {Array.from({ length: preparingImages }, (_, index) => (
                  <span key={`preparing-${index}`} role="status" aria-label={t('tutor.images.preparing')} className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-slate-600">
                    <FiLoader aria-hidden="true" className="h-5 w-5 animate-spin" />
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-1.5 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60">
              <ComposerOptions
                subject={subject}
                webSearch={webSearch}
                onSubjectChange={(value) => updateSettings({ subject: value })}
                onWebSearchChange={(value) => updateSettings({ webSearch: value })}
                onPickImages={() => fileInputRef.current?.click()}
                imagesFull={pendingImages.length + preparingImages >= MAX_IMAGES}
                onStartSpeaking={startSpeakingPractice}
                disabled={busyComposer}
              />
              {recorder.recording ? (
                <div role="status" className="flex min-h-10 min-w-0 flex-1 items-center gap-2 px-1 text-sm text-slate-700 dark:text-slate-200">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                  <span className="sr-only min-[400px]:not-sr-only min-[400px]:truncate">{t('tutor.voice.recording')}</span>
                  <span className="ml-auto whitespace-nowrap font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatSeconds(recorder.elapsed)} / {formatSeconds(MAX_RECORD_SECONDS)}</span>
                  <button type="button" onClick={recorder.cancel} aria-label={t('tutor.voice.cancel')} title={t('tutor.voice.cancel')} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><FiX aria-hidden="true" className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <label className="sr-only" htmlFor="tutor-input">{t('tutor.placeholder')}</label>
                  <textarea
                    id="tutor-input"
                    ref={textareaRef}
                    rows={1}
                    maxLength={MAX_LENGTH}
                    value={input}
                    disabled={transcribing}
                    placeholder={transcribing ? t('tutor.voice.transcribing') : speakingMode ? t('tutor.speaking.placeholder') : t('tutor.placeholder')}
                    onChange={(event) => { setInput(event.target.value); resizeTextarea() }}
                    onPaste={(event) => {
                      const images = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'))
                      if (images.length) {
                        event.preventDefault()
                        addImageFiles(images)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        if (canSend) sendMessage()
                      }
                    }}
                    className="max-h-40 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-white sm:text-sm"
                  />
                </>
              )}
              {recorder.recording ? (
                <button type="button" onClick={recorder.stop} aria-label={t('tutor.voice.stop')} title={t('tutor.voice.stop')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600">
                  <FiSquare aria-hidden="true" className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={recorder.start}
                  disabled={transcribing}
                  aria-label={transcribing ? t('tutor.voice.transcribing') : t('tutor.voice.record')}
                  title={transcribing ? t('tutor.voice.transcribing') : t('tutor.voice.record')}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition disabled:cursor-wait ${speakingMode ? 'bg-violet-500 text-white hover:bg-violet-600' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                >
                  {transcribing ? <FiLoader aria-hidden="true" className="h-5 w-5 animate-spin" /> : <FiMic aria-hidden="true" className="h-5 w-5" />}
                </button>
              )}
              {sendingHere ? (
                <button type="button" onClick={abortStream} aria-label={t('tutor.stop')} title={t('tutor.stop')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  <FiSquare aria-hidden="true" className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button type="submit" disabled={!canSend} aria-label={t('tutor.send')} title={t('tutor.send')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700">
                  <FiSend aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-1 hidden justify-between px-3 text-[11px] text-slate-400 sm:flex">
              <span>{t('tutor.hint')}</span>
              <span>{t('tutor.characters', { count: input.length })}</span>
            </div>
          </div>
        </form>
      </section>

      {createPortal(
        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-[1100] lg:hidden" role="dialog" aria-modal="true" aria-label={t('tutor.conversations')}>
              <motion.button
                type="button"
                aria-label={t('tutor.close')}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl dark:bg-slate-900"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.22 }}
              >
                <ConversationList {...listProps} onClose={() => setDrawerOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

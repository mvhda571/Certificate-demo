import { useMemo, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSquare, FiVolume2, FiVolumeX } from 'react-icons/fi'
import {
  detectLanguage,
  findVoice,
  getSpeakingId,
  getVoicesSnapshot,
  speak,
  speechSupported,
  stopSpeaking,
  subscribeSpeaking,
  subscribeVoices,
  toSpeakableText,
} from '../../utils/speech'

const noopSubscribe = () => () => {}
const emptyVoices = { voices: [], loaded: true }

// AI javobini brauzer ovozi bilan o'qiydi; til matndan avtomatik aniqlanadi.
export function ListenButton({ id, content }) {
  const { t } = useTranslation()
  const supported = speechSupported()
  const { voices, loaded } = useSyncExternalStore(supported ? subscribeVoices : noopSubscribe, supported ? getVoicesSnapshot : () => emptyVoices)
  const speakingId = useSyncExternalStore(subscribeSpeaking, getSpeakingId)
  const text = useMemo(() => toSpeakableText(content), [content])
  const language = useMemo(() => detectLanguage(text), [text])
  const voice = useMemo(() => findVoice(voices, language), [voices, language])
  const speaking = speakingId === id

  if (!text) return null
  const baseClass = 'inline-flex items-center gap-1 rounded-md py-1'
  if (!supported || (loaded && !voice)) {
    return (
      <span className={`${baseClass} cursor-not-allowed text-slate-300 dark:text-slate-600`} title={supported ? t('tutor.listen.unavailable') : t('tutor.listen.unsupported')}>
        <FiVolumeX aria-hidden="true" />{supported ? t('tutor.listen.unavailable') : t('tutor.listen.unsupported')}
      </span>
    )
  }

  return (
    <button
      type="button"
      disabled={!voice}
      aria-pressed={speaking}
      onClick={() => (speaking ? stopSpeaking() : speak(id, text, voice))}
      title={voice ? `${voice.name} (${voice.lang})` : undefined}
      className={`${baseClass} hover:text-slate-700 disabled:opacity-50 dark:hover:text-slate-200 ${speaking ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}
    >
      {speaking ? <FiSquare aria-hidden="true" className="fill-current" /> : <FiVolume2 aria-hidden="true" />}
      {speaking ? t('tutor.listen.stop') : t('tutor.listen.play')}
    </button>
  )
}

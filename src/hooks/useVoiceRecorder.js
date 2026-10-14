import { useCallback, useEffect, useRef, useState } from 'react'

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const MIN_SECONDS = 0.6

// Mikrofondan ovoz yozadi (MediaRecorder). maxSeconds dan keyin avtomatik to'xtaydi.
// onAudio(blob, seconds) — yozuv tugaganda chaqiriladi; bekor qilinganda chaqirilmaydi.
export function useVoiceRecorder({ maxSeconds = 60, onAudio }) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)
  const onAudioRef = useRef(onAudio)
  useEffect(() => { onAudioRef.current = onAudio }, [onAudio])

  const releaseStream = () => {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    stop()
  }, [stop])

  const start = useCallback(async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('unsupported')
      return
    }
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (reason) {
      setError(reason?.name === 'NotAllowedError' || reason?.name === 'SecurityError' ? 'denied' : 'unavailable')
      return
    }

    const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type)) || ''
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32000 } : undefined)
    const chunks = []
    const startedAt = Date.now()
    cancelledRef.current = false
    streamRef.current = stream
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onstop = () => {
      releaseStream()
      setRecording(false)
      const seconds = (Date.now() - startedAt) / 1000
      if (cancelledRef.current) return
      if (seconds < MIN_SECONDS || !chunks.length) {
        setError('tooShort')
        return
      }
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
      onAudioRef.current?.(blob, Math.min(seconds, maxSeconds))
    }

    recorder.start(250)
    setElapsed(0)
    setRecording(true)
    timerRef.current = setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000
      setElapsed(Math.min(seconds, maxSeconds))
      if (seconds >= maxSeconds) recorder.state === 'recording' && recorder.stop()
    }, 200)
  }, [maxSeconds])

  // Sahifadan chiqilganda mikrofon yopiladi.
  useEffect(() => () => {
    cancelledRef.current = true
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    releaseStream()
  }, [])

  return { recording, elapsed, error, start, stop, cancel, clearError: () => setError('') }
}

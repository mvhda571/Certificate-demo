import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useUserStore } from '../store/useUserStore'

const GOOGLE_SCRIPT_ID = 'google-identity-services'
const CLIENT_ID_PATTERN = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i
let initializedClientId = ''
let activeCredentialHandler = null

function decodeCredential(credential) {
  if (!credential || credential.split('.').length !== 3) throw new Error('Invalid Google credential')
  const payload = credential.split('.')[1]
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(atob(base64).split('').map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
  return JSON.parse(json)
}

export function useGoogleAuth() {
  const buttonRef = useRef(null)
  const loginWithGoogle = useUserStore(state => state.loginWithGoogle)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
  const isConfigured = CLIENT_ID_PATTERN.test(clientId)
  const retry = useCallback(() => { setError(''); setRetryCount(value => value + 1) }, [])

  useEffect(() => {
    if (!isConfigured) return undefined
    let cancelled = false

    activeCredentialHandler = ({ credential }) => {
      try {
        const account = decodeCredential(credential)
        if (!account.email || !account.sub) throw new Error('Required claims are missing')
        loginWithGoogle({ email: account.email, displayName: account.name || account.email, photoURL: account.picture || '', googleId: account.sub, credential })
        toast.success('Google akkauntingiz muvaffaqiyatli ulandi')
      } catch {
        setError('Google orqali kirish yakunlanmadi. Qayta urinib ko‘ring.')
      }
    }

    const initialize = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return
      if (initializedClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: response => activeCredentialHandler?.(response),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        initializedClientId = clientId
      }
      buttonRef.current.replaceChildren()
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
        text: 'continue_with', width: Math.min(buttonRef.current.clientWidth || 320, 400),
      })
    }

    const handleScriptError = () => {
      if (!cancelled) setError('Google kirish xizmati yuklanmadi. Internet aloqasini tekshiring.')
    }

    if (window.google?.accounts?.id) initialize()
    else {
      let script = document.getElementById(GOOGLE_SCRIPT_ID)
      if (script?.dataset.failed === 'true') { script.remove(); script = null }
      if (!script) {
        script = document.createElement('script')
        script.id = GOOGLE_SCRIPT_ID
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.addEventListener('error', () => { script.dataset.failed = 'true' }, { once: true })
        document.head.appendChild(script)
      }
      script.addEventListener('load', initialize, { once: true })
      script.addEventListener('error', handleScriptError, { once: true })
    }

    return () => { cancelled = true }
  }, [clientId, isConfigured, loginWithGoogle, retryCount])

  return { buttonRef, error, isConfigured, retry }
}

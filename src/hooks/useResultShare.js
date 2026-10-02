import { useCallback, useState } from 'react'
import { toPng } from 'html-to-image'

/**
 * Natija blokini (DOM ref orqali) PNG rasmga aylantirib, uni yuklab olish
 * yoki qurilmaning "Ulashish" oynasi (Telegram, WhatsApp va h.k.) orqali
 * jo'natish imkonini beradi. Backend shart emas — hammasi brauzerda bo'ladi.
 */
export function useResultShare(ref, fileName = 'natija') {
  const [busy, setBusy] = useState(false)

  const capture = useCallback(async () => {
    if (!ref.current) return null
    return toPng(ref.current, { pixelRatio: 2, cacheBust: true })
  }, [ref])

  const download = useCallback(async () => {
    setBusy(true)
    try {
      const dataUrl = await capture()
      if (!dataUrl) return
      const link = document.createElement('a')
      link.download = `${fileName}.png`
      link.href = dataUrl
      link.click()
    } catch { /* rasm yaratib bo'lmadi — jim e'tiborsiz qoldiramiz */ }
    finally { setBusy(false) }
  }, [capture, fileName])

  const share = useCallback(async (text) => {
    setBusy(true)
    try {
      const dataUrl = await capture()
      if (!dataUrl) return
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mening natijam', text })
        return
      }
      // Ulashish API qo'llamaydigan brauzerlarda rasm yuklab olinadi —
      // foydalanuvchi uni qo'lda Telegram/WhatsApp'da yuborishi mumkin.
      const link = document.createElement('a')
      link.download = `${fileName}.png`
      link.href = dataUrl
      link.click()
    } catch { /* foydalanuvchi ulashishni bekor qilgan bo'lishi mumkin */ }
    finally { setBusy(false) }
  }, [capture, fileName])

  return { busy, download, share }
}

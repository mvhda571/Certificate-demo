import { FiDownload, FiShare2 } from 'react-icons/fi'
import { useResultShare } from '../hooks/useResultShare'

/**
 * Natija blokini (cardRef) rasm qilib yuklab olish / ulashish tugmalari.
 * cardRef — natija ko'rsatilgan DOM elementga biriktirilgan ref.
 */
export function ShareResultButtons({ cardRef, fileName, shareText, className = '' }) {
  const { busy, download, share } = useResultShare(cardRef, fileName)
  return <div className={`flex flex-wrap gap-3 ${className}`}>
    <button type="button" disabled={busy} onClick={download} className="btn-secondary disabled:opacity-50"><FiDownload/> Rasm qilib yuklab olish</button>
    <button type="button" disabled={busy} onClick={() => share(shareText)} className="btn-primary disabled:opacity-50"><FiShare2/> Ulashish</button>
  </div>
}

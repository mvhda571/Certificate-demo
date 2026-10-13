const MAX_SIDE = 1600
// Server har bir rasm uchun ~1.6 MB base64 qabul qiladi; biroz zaxira qoldiramiz.
const MAX_DATA_URL_LENGTH = 1_450_000
const MAX_SOURCE_BYTES = 25 * 1024 * 1024

export class ImageCompressError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      // EXIF bo'yicha aylantirish (telefon kamerasi) — imageOrientation: 'from-image'.
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Ba'zi brauzerlar opsiyani qo'llamaydi — <img> orqali urinib ko'ramiz.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Rasmni brauzerda kichraytirib (eng uzun tomoni 1600px) JPEG data URL'ga aylantiradi.
export async function compressImage(file) {
  if (!file?.type?.startsWith('image/')) throw new ImageCompressError('notImage')
  if (file.size > MAX_SOURCE_BYTES) throw new ImageCompressError('tooLarge')

  let source
  try {
    source = await loadImage(file)
  } catch {
    throw new ImageCompressError('failed')
  }
  const width = source.width || source.naturalWidth
  const height = source.height || source.naturalHeight
  if (!width || !height) throw new ImageCompressError('failed')

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext('2d')
  // Shaffof PNG qora bo'lib qolmasligi uchun oq fon.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close?.()

  let quality = 0.82
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.45) {
    quality -= 0.12
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) throw new ImageCompressError('tooLarge')
  return { dataUrl, width: canvas.width, height: canvas.height }
}

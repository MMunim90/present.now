import { getMedia } from '../services/storage/mediaStorage'

export async function mediaToDataUrl(mediaId) {
  if (!mediaId) return null
  const record = await getMedia(mediaId)
  if (!record || !record.blob) return null
  return await blobToDataUrl(record.blob)
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Maps our PAGE_WIDTH-based pixel coordinate space onto a target coordinate
// system (PDF points, PPTX inches, etc.) proportionally.
export function scaleCoords(box, pageWidth, targetWidth, targetHeight, pageHeightPx) {
  const scaleX = targetWidth / pageWidth
  const scaleY = targetHeight / pageHeightPx
  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  }
}

export function formatRelativeTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200]

export function nextZoom(current, direction) {
  const idx = ZOOM_LEVELS.indexOf(current)
  if (idx === -1) return 100
  const nextIdx = clamp(idx + direction, 0, ZOOM_LEVELS.length - 1)
  return ZOOM_LEVELS[nextIdx]
}

// Colour helpers shared by the Chart.js renderer and the SVG function plotter.

export const PALETTE = ['#3366ff', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function hexToRgb(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function isValidColor(hex) {
  return hexToRgb(hex) !== null
}

export function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

// Perceived brightness 0..1 (used to pick readable text on a custom background).
export function luminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 1
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
}

/**
 * Resolve every colour a graph needs from the (optional) custom background
 * and the current app theme. An empty background means "match the box", i.e.
 * the app's own surface colour in light/dark mode.
 */
export function resolveGraphColors(background, isDark) {
  const custom = isValidColor(background) ? background : null
  const bg = custom || (isDark ? '#1f2937' : '#ffffff')
  const darkBg = luminance(bg) < 0.5
  return {
    bg,
    darkBg,
    text: darkBg ? '#f3f4f6' : '#111827',
    muted: darkBg ? '#9ca3af' : '#6b7280',
    grid: darkBg ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.10)',
    axis: darkBg ? 'rgba(255,255,255,0.55)' : 'rgba(17,24,39,0.55)',
  }
}

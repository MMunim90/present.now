// Geometry helpers for the SVG function plotter.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** "Nice" axis ticks (steps of 1, 2 or 5 × 10^k) covering [min, max]. */
export function niceTicks(min, max, target = 8) {
  const span = max - min
  if (!(span > 0) || !Number.isFinite(span)) return { ticks: [], step: 1 }
  const raw = span / Math.max(1, target)
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * pow
  const start = Math.ceil(min / step - 1e-9) * step
  const ticks = []
  for (let v = start; v <= max + step * 1e-9 && ticks.length < 200; v += step) {
    ticks.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toFixed(12))
  }
  return { ticks, step }
}

export function formatTick(v, step) {
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e6 || abs < 1e-4) return v.toExponential(1).replace('+', '')
  const decimals = Math.min(6, Math.max(0, -Math.floor(Math.log10(step) + 1e-9)))
  return String(+v.toFixed(decimals))
}

export function formatValue(v) {
  if (!Number.isFinite(v)) return String(v)
  const abs = Math.abs(v)
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-4)) return v.toExponential(3)
  return String(+v.toPrecision(5))
}

/**
 * Sample `fn` across the view and return an SVG path string in pixel space.
 * Gaps are inserted for non-finite values and for vertical jumps (asymptotes
 * such as tan(x) or 1/x), so the curve never draws a false connecting line.
 */
export function buildPath(fn, view, plot, samples) {
  const { xMin, xMax, yMin, yMax } = view
  const { l, t, w, h } = plot
  const xSpan = xMax - xMin
  const ySpan = yMax - yMin
  let d = ''
  let pen = false
  let prevPy = 0
  for (let i = 0; i <= samples; i++) {
    const x = xMin + (xSpan * i) / samples
    let y
    try {
      y = fn(x)
    } catch {
      y = NaN
    }
    if (!Number.isFinite(y)) {
      pen = false
      continue
    }
    const px = l + ((x - xMin) / xSpan) * w
    const py = clamp(t + h - ((y - yMin) / ySpan) * h, -1e5, 1e5)
    if (pen && Math.abs(py - prevPy) > h * 2) pen = false
    d += `${pen ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`
    pen = true
    prevPy = py
  }
  return d
}

/** Zoom a view about a fixed data point (fx, fy), keeping that point stationary. */
export function zoomView(view, factor, fx, fy) {
  const MIN_SPAN = 1e-6
  const MAX_SPAN = 1e9
  const xSpan = clamp((view.xMax - view.xMin) * factor, MIN_SPAN, MAX_SPAN)
  const ySpan = clamp((view.yMax - view.yMin) * factor, MIN_SPAN, MAX_SPAN)
  const rx = (fx - view.xMin) / (view.xMax - view.xMin)
  const ry = (fy - view.yMin) / (view.yMax - view.yMin)
  return {
    xMin: fx - rx * xSpan,
    xMax: fx + (1 - rx) * xSpan,
    yMin: fy - ry * ySpan,
    yMax: fy + (1 - ry) * ySpan,
  }
}

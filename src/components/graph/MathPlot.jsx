import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { compileExpression } from '../../utils/graph/expressionParser'
import { buildPath, formatTick, formatValue, niceTicks, zoomView } from '../../utils/graph/mathPlotUtils'

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/**
 * Function graph renderer.
 *
 * Everything (background, title, grid, axes, curves, legend, labels) is drawn
 * with plain SVG attributes — no CSS classes — so the serialised SVG is a
 * fully self-contained file for export. Interactive-only overlays are tagged
 * `data-export-ignore` and stripped from exports.
 *
 * Pan/zoom is kept in transient local state while the user interacts and is
 * committed to the document once (on pointer-up / after the wheel settles),
 * so dragging never re-renders the whole canvas on every frame.
 */
const MathPlot = forwardRef(function MathPlot({ graph, colors, width, height, interactive, onViewChange }, ref) {
  const svgRef = useRef(null)
  const clipId = `pn-clip-${useId().replace(/:/g, '')}`
  const [live, setLive] = useState(null)
  const [hoverPx, setHoverPx] = useState(null)
  const liveRef = useRef(null)
  const dragRef = useRef(null)
  const timerRef = useRef(null)

  const s = graph.settings
  const fs = s.fontSize
  const view = live || graph.view

  // ---- layout --------------------------------------------------------------
  const top = 10 + (graph.title ? fs + 10 : 0) + (graph.subtitle ? fs + 4 : 0)
  const left = 12 + Math.round(fs * 3.4) + (s.yLabel ? fs + 8 : 0)
  const bottom = 12 + fs + 6 + (s.xLabel ? fs + 8 : 0)
  const right = 16
  const plot = { l: left, t: top, w: Math.max(10, width - left - right), h: Math.max(10, height - top - bottom) }
  const xSpan = view.xMax - view.xMin
  const ySpan = view.yMax - view.yMin
  const sx = (x) => plot.l + ((x - view.xMin) / xSpan) * plot.w
  const sy = (y) => plot.t + plot.h - ((y - view.yMin) / ySpan) * plot.h

  // ---- compiled expressions (re-parsed only when the list changes) -----------
  const compiled = useMemo(() => graph.functions.map((f) => ({ ...f, ...compileExpression(f.expr) })), [graph.functions])
  const drawable = compiled.filter((f) => f.fn && f.visible)

  const xTicks = niceTicks(view.xMin, view.xMax, Math.max(2, Math.floor(plot.w / 70)))
  const yTicks = niceTicks(view.yMin, view.yMax, Math.max(2, Math.floor(plot.h / 48)))
  const samples = clamp(Math.round(plot.w * 1.5), 100, 2000)

  const paths = useMemo(
    () => drawable.map((f) => ({ id: f.id, color: f.color, d: buildPath(f.fn, view, plot, samples) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph.functions, view.xMin, view.xMax, view.yMin, view.yMax, plot.l, plot.t, plot.w, plot.h, samples]
  )

  // ---- latest values for native listeners ------------------------------------
  const latest = useRef({})
  latest.current = { plot, view, width, onViewChange }

  const commit = () => {
    const v = liveRef.current
    liveRef.current = null
    setLive(null)
    if (v) latest.current.onViewChange?.(v)
  }

  const toLocal = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect()
    // rect is the *rendered* size (includes canvas/box zoom transforms); scale
    // back into the SVG's own pixel space so maths is zoom-independent.
    const k = latest.current.width / rect.width
    return { px: (clientX - rect.left) * k, py: (clientY - rect.top) * k, k }
  }

  // Wheel zoom: native non-passive listener (React's onWheel is passive).
  // Only active while the box is selected so plain scrolling over an
  // unselected graph still scrolls the canvas. Ctrl+wheel is left alone for
  // the canvas-level zoom.
  useEffect(() => {
    const el = svgRef.current
    if (!el || !interactive) return undefined
    const onWheel = (e) => {
      if (e.ctrlKey) return
      e.preventDefault()
      const { plot: p, view: v } = latest.current
      const cur = liveRef.current || v
      const { px, py } = toLocal(e.clientX, e.clientY)
      const fx = cur.xMin + ((clamp(px, p.l, p.l + p.w) - p.l) / p.w) * (cur.xMax - cur.xMin)
      const fy = cur.yMin + ((p.t + p.h - clamp(py, p.t, p.t + p.h)) / p.h) * (cur.yMax - cur.yMin)
      const next = zoomView(cur, Math.exp(e.deltaY * 0.0015), fx, fy)
      liveRef.current = next
      setLive(next)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(commit, 250)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive])

  // Flush any pending zoom if the plot unmounts mid-gesture; never leak the timer.
  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
      if (liveRef.current) latest.current.onViewChange?.(liveRef.current)
    },
    []
  )

  // ---- pointer: drag to pan, hover to read values ---------------------------
  const onPointerDown = (e) => {
    if (!interactive || e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, view: liveRef.current || view }
    setHoverPx(null)
  }

  const onPointerMove = (e) => {
    const drag = dragRef.current
    if (drag) {
      const { k } = toLocal(e.clientX, e.clientY)
      const dx = ((e.clientX - drag.x) * k / plot.w) * (drag.view.xMax - drag.view.xMin)
      const dy = ((e.clientY - drag.y) * k / plot.h) * (drag.view.yMax - drag.view.yMin)
      const next = {
        xMin: drag.view.xMin - dx,
        xMax: drag.view.xMax - dx,
        yMin: drag.view.yMin + dy,
        yMax: drag.view.yMax + dy,
      }
      liveRef.current = next
      setLive(next)
      return
    }
    const { px } = toLocal(e.clientX, e.clientY)
    setHoverPx(px >= plot.l && px <= plot.l + plot.w ? px : null)
  }

  const endDrag = (e) => {
    if (!dragRef.current) return
    dragRef.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    commit()
  }

  // ---- export ----------------------------------------------------------------
  const serialize = () => {
    const clone = svgRef.current.cloneNode(true)
    clone.querySelectorAll('[data-export-ignore]').forEach((n) => n.remove())
    clone.removeAttribute('style')
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(width))
    clone.setAttribute('height', String(height))
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`
  }

  useImperativeHandle(ref, () => ({
    toSVGString: serialize,
    toPNGBlob: async () => {
      const url = URL.createObjectURL(new Blob([serialize()], { type: 'image/svg+xml;charset=utf-8' }))
      try {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('Could not render the graph to an image.'))
          img.src = url
        })
        const scale = 2
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(width * scale)
        canvas.height = Math.round(height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        return await new Promise((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the PNG image.'))), 'image/png')
        )
      } finally {
        URL.revokeObjectURL(url)
      }
    },
  }))

  // ---- hover readout -----------------------------------------------------------
  let hover = null
  if (hoverPx !== null && drawable.length) {
    const hx = view.xMin + ((hoverPx - plot.l) / plot.w) * xSpan
    const rows = drawable.map((f) => {
      let y = NaN
      try {
        y = f.fn(hx)
      } catch {
        /* leave NaN */
      }
      return { f, y }
    })
    hover = { hx, rows }
  }

  // ---- legend --------------------------------------------------------------------
  const legendRows = s.showLegend ? drawable : []
  const legendLabel = (f) => `y = ${f.expr.replace(/^\s*(y|f\(x\))\s*=\s*/i, '').trim()}`.slice(0, 28)
  const legendW = legendRows.length ? Math.max(...legendRows.map((f) => legendLabel(f).length)) * fs * 0.58 + 34 : 0
  const rowH = fs + 8

  const axisX = view.yMin <= 0 && view.yMax >= 0 ? sy(0) : null
  const axisY = view.xMin <= 0 && view.xMax >= 0 ? sx(0) : null

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fontFamily={FONT}
      role="img"
      aria-label={graph.title ? `Function graph: ${graph.title}` : 'Function graph'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHoverPx(null)}
      style={{ display: 'block', cursor: interactive ? (dragRef.current ? 'grabbing' : 'grab') : 'default', touchAction: interactive ? 'none' : 'auto' }}
    >
      <rect x="0" y="0" width={width} height={height} fill={colors.bg} />

      {graph.title && (
        <text x={width / 2} y={10 + fs + 2} textAnchor="middle" fontSize={fs + 4} fontWeight="600" fill={colors.text}>
          {graph.title}
        </text>
      )}
      {graph.subtitle && (
        <text x={width / 2} y={10 + (graph.title ? fs + 10 : 0) + fs + 2} textAnchor="middle" fontSize={fs} fill={colors.muted}>
          {graph.subtitle}
        </text>
      )}

      <defs>
        <clipPath id={clipId}>
          <rect x={plot.l} y={plot.t} width={plot.w} height={plot.h} />
        </clipPath>
      </defs>

      {s.showGrid && (
        <g stroke={colors.grid} strokeWidth="1">
          {xTicks.ticks.map((t) => (
            <line key={`gx${t}`} x1={sx(t)} y1={plot.t} x2={sx(t)} y2={plot.t + plot.h} />
          ))}
          {yTicks.ticks.map((t) => (
            <line key={`gy${t}`} x1={plot.l} y1={sy(t)} x2={plot.l + plot.w} y2={sy(t)} />
          ))}
        </g>
      )}

      <g clipPath={`url(#${clipId})`}>
        {axisX !== null && <line x1={plot.l} y1={axisX} x2={plot.l + plot.w} y2={axisX} stroke={colors.axis} strokeWidth="1.4" />}
        {axisY !== null && <line x1={axisY} y1={plot.t} x2={axisY} y2={plot.t + plot.h} stroke={colors.axis} strokeWidth="1.4" />}
        {paths.map((p) => (
          <path key={p.id} d={p.d} fill="none" stroke={p.color} strokeWidth={s.lineWidth} strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </g>

      <rect x={plot.l} y={plot.t} width={plot.w} height={plot.h} fill="none" stroke={colors.axis} strokeOpacity="0.5" strokeWidth="1" />

      <g fill={colors.muted} fontSize={fs}>
        {xTicks.ticks.map((t) => (
          <text key={`tx${t}`} x={sx(t)} y={plot.t + plot.h + fs + 4} textAnchor="middle">
            {formatTick(t, xTicks.step)}
          </text>
        ))}
        {yTicks.ticks.map((t) => (
          <text key={`ty${t}`} x={plot.l - 6} y={sy(t) + fs * 0.35} textAnchor="end">
            {formatTick(t, yTicks.step)}
          </text>
        ))}
      </g>

      {s.xLabel && (
        <text x={plot.l + plot.w / 2} y={height - 8} textAnchor="middle" fontSize={fs} fill={colors.text}>
          {s.xLabel}
        </text>
      )}
      {s.yLabel && (
        <text transform={`translate(${12 + fs * 0.4} ${plot.t + plot.h / 2}) rotate(-90)`} textAnchor="middle" fontSize={fs} fill={colors.text}>
          {s.yLabel}
        </text>
      )}

      {legendRows.length > 0 && (
        <g>
          <rect
            x={plot.l + plot.w - legendW - 8}
            y={plot.t + 8}
            width={legendW}
            height={legendRows.length * rowH + 6}
            rx="6"
            fill={colors.bg}
            fillOpacity="0.88"
            stroke={colors.grid}
          />
          {legendRows.map((f, i) => {
            const y = plot.t + 8 + 3 + i * rowH + rowH / 2
            const x0 = plot.l + plot.w - legendW - 8 + 8
            return (
              <g key={f.id}>
                <line x1={x0} y1={y} x2={x0 + 16} y2={y} stroke={f.color} strokeWidth="2.5" strokeLinecap="round" />
                <text x={x0 + 22} y={y + fs * 0.35} fontSize={fs} fill={colors.text}>
                  {legendLabel(f)}
                </text>
              </g>
            )
          })}
        </g>
      )}

      {hover && (
        <g data-export-ignore="true" pointerEvents="none">
          <line x1={hoverPx} y1={plot.t} x2={hoverPx} y2={plot.t + plot.h} stroke={colors.axis} strokeOpacity="0.6" strokeDasharray="4 3" />
          {hover.rows.map(
            ({ f, y }) =>
              Number.isFinite(y) &&
              y >= view.yMin &&
              y <= view.yMax && <circle key={f.id} cx={hoverPx} cy={sy(y)} r="4" fill={f.color} stroke={colors.bg} strokeWidth="1.5" />
          )}
          {(() => {
            const lines = [`x = ${formatValue(hover.hx)}`, ...hover.rows.map(({ f, y }) => `${legendLabel(f).slice(4, 16)}: ${formatValue(y)}`)]
            const w = Math.max(...lines.map((l) => l.length)) * fs * 0.6 + 16
            const h = lines.length * (fs + 4) + 8
            const bx = hoverPx + 12 + w > plot.l + plot.w ? hoverPx - 12 - w : hoverPx + 12
            const by = plot.t + plot.h - h - 8
            return (
              <g>
                <rect x={bx} y={by} width={w} height={h} rx="6" fill={colors.bg} fillOpacity="0.95" stroke={colors.axis} strokeOpacity="0.6" />
                {lines.map((l, i) => (
                  <text key={i} x={bx + 8} y={by + 6 + (i + 1) * (fs + 4) - 3} fontSize={fs} fill={i === 0 ? colors.muted : colors.text}>
                    {l}
                  </text>
                ))}
              </g>
            )
          })()}
        </g>
      )}
    </svg>
  )
})

export default React.memo(MathPlot)

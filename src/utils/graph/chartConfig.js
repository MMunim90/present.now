import { getCapabilities, TYPE_INFO } from './graphDefaults'
import { PALETTE, withAlpha } from './graphTheme'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const fmt = (v) => String(Number(v.toFixed(2)))

/** Bin raw numbers into `bins` equal-width buckets. */
export function computeHistogram(values, bins) {
  const nums = (values || []).filter(isNum)
  if (!nums.length) return { labels: [], counts: [] }
  let min = Infinity
  let max = -Infinity
  for (const v of nums) {
    if (v < min) min = v
    if (v > max) max = v
  }
  if (min === max) {
    min -= 0.5
    max += 0.5
  }
  const k = Math.min(100, Math.max(1, Math.round(bins) || 6))
  const width = (max - min) / k
  const counts = new Array(k).fill(0)
  for (const v of nums) {
    let i = Math.floor((v - min) / width)
    if (i >= k) i = k - 1
    counts[i] += 1
  }
  const labels = counts.map((_, i) => `${fmt(min + i * width)}–${fmt(min + (i + 1) * width)}`)
  return { labels, counts }
}

const emptyMessage = {
  category: 'No data yet — add rows in the Data tab.',
  xy: 'No points yet — add points in the Data tab.',
  histogram: 'No values yet — enter numbers in the Data tab.',
}

/**
 * Translate our persisted graph model into a Chart.js config.
 * Pure function (no DOM / no Chart.js import) so it is cheap to memoise and test.
 * Returns { type, data, options, empty } — `empty` is a message when there is
 * nothing to draw (so the UI can show a friendly hint instead of a blank chart).
 */
export function buildChartConfig(g, colors) {
  const s = g.settings
  const caps = getCapabilities(g.chartType)
  const family = TYPE_INFO[g.chartType].family
  const font = { size: s.fontSize }
  const type = g.chartType

  // ---- datasets ----------------------------------------------------------
  let chartType = 'bar'
  let data = { labels: [], datasets: [] }
  let empty = null

  const lineStyle = (d, fill) => ({
    borderColor: d.color,
    backgroundColor: withAlpha(d.color, fill ? 0.28 : 0.2),
    borderWidth: s.lineWidth,
    pointRadius: s.pointSize,
    pointHoverRadius: s.pointSize + 2,
    pointBackgroundColor: d.color,
    tension: 0.25,
    fill,
  })
  const barStyle = (d) => ({
    backgroundColor: withAlpha(d.color, 0.85),
    borderColor: d.color,
    borderWidth: 1,
    borderRadius: 3,
  })

  if (family === 'category') {
    const labels = g.labels
    const sets = caps.pieLike ? g.datasets.slice(0, 1) : g.datasets
    if (!labels.length || !sets.length) empty = emptyMessage.category

    if (type === 'pie' || type === 'doughnut' || type === 'polarArea') {
      chartType = type
      data = {
        labels,
        datasets: sets.map((d) => {
          const colorsFor = labels.map((_, j) => d.sliceColors?.[j] || PALETTE[j % PALETTE.length])
          return {
            id: d.id,
            label: d.label,
            data: d.data,
            backgroundColor: colorsFor.map((c) => withAlpha(c, type === 'polarArea' ? 0.7 : 0.9)),
            borderColor: colors.bg,
            borderWidth: 2,
          }
        }),
      }
    } else if (type === 'radar') {
      chartType = 'radar'
      data = { labels, datasets: sets.map((d) => ({ id: d.id, label: d.label, data: d.data, ...lineStyle(d, true) })) }
    } else if (type === 'line' || type === 'area') {
      chartType = 'line'
      data = { labels, datasets: sets.map((d) => ({ id: d.id, label: d.label, data: d.data, ...lineStyle(d, type === 'area') })) }
    } else if (type === 'mixed') {
      chartType = 'bar'
      data = {
        labels,
        datasets: sets.map((d) =>
          d.kind === 'line'
            ? { id: d.id, type: 'line', order: 0, label: d.label, data: d.data, ...lineStyle(d, false) }
            : { id: d.id, type: 'bar', order: 1, label: d.label, data: d.data, ...barStyle(d) }
        ),
      }
    } else {
      // bar, horizontalBar, stackedBar
      chartType = 'bar'
      data = { labels, datasets: sets.map((d) => ({ id: d.id, label: d.label, data: d.data, ...barStyle(d) })) }
    }
  } else if (family === 'xy') {
    chartType = type // scatter | bubble
    const total = g.datasets.reduce((n, d) => n + d.data.length, 0)
    if (!total) empty = emptyMessage.xy
    data = {
      datasets: g.datasets.map((d) =>
        type === 'bubble'
          ? {
              id: d.id,
              label: d.label,
              data: d.data.map((p) => ({ x: p.x, y: p.y, r: p.r })),
              backgroundColor: withAlpha(d.color, 0.5),
              borderColor: d.color,
              borderWidth: 1,
            }
          : {
              id: d.id,
              label: d.label,
              data: d.data.map((p) => ({ x: p.x, y: p.y })),
              backgroundColor: d.color,
              borderColor: d.color,
              pointRadius: s.pointSize + 1,
              pointHoverRadius: s.pointSize + 3,
            }
      ),
    }
  } else {
    // histogram
    chartType = 'bar'
    const d = g.datasets[0]
    const { labels, counts } = computeHistogram(d.data, s.bins)
    if (!labels.length) empty = emptyMessage.histogram
    data = {
      labels,
      datasets: [
        {
          id: d.id,
          label: d.label,
          data: counts,
          backgroundColor: withAlpha(d.color, 0.85),
          borderColor: d.color,
          borderWidth: 1,
          barPercentage: 1,
          categoryPercentage: 1,
        },
      ],
    }
  }

  // ---- axes --------------------------------------------------------------
  const range = (min, max) => ({ ...(isNum(min) ? { min } : {}), ...(isNum(max) ? { max } : {}) })
  const axis = (title, extra = {}) => ({
    title: { display: !!title, text: title, color: colors.text, font },
    grid: { display: s.showGrid, color: colors.grid },
    border: { color: colors.axis },
    ticks: { color: colors.muted, font },
    ...extra,
  })

  let scales
  const horizontal = type === 'horizontalBar'
  if (caps.radial) {
    scales = {
      r: {
        grid: { display: s.showGrid, color: colors.grid },
        angleLines: { display: s.showGrid, color: colors.grid },
        ticks: { color: colors.muted, backdropColor: 'transparent', font },
        pointLabels: { color: colors.text, font },
        beginAtZero: true,
        ...range(s.yMin, s.yMax),
      },
    }
  } else if (!caps.pieLike) {
    const valueBase = type === 'scatter' || type === 'bubble' ? {} : { beginAtZero: true }
    scales = {
      x: axis(s.xLabel, {
        ...(horizontal ? { ...valueBase, ...range(s.yMin, s.yMax) } : {}),
        ...(caps.xRange ? range(s.xMin, s.xMax) : {}),
        ...(type === 'stackedBar' ? { stacked: true } : {}),
      }),
      y: axis(s.yLabel, {
        ...(horizontal ? {} : { ...valueBase, ...range(s.yMin, s.yMax) }),
        ...(type === 'stackedBar' ? { stacked: true } : {}),
      }),
    }
  }

  const sharedInteraction = ['bar', 'horizontalBar', 'stackedBar', 'line', 'area', 'mixed', 'histogram'].includes(type)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    ...(horizontal ? { indexAxis: 'y' } : {}),
    ...(sharedInteraction ? { interaction: { mode: 'index', intersect: false } } : {}),
    plugins: {
      legend: { display: s.showLegend, labels: { color: colors.text, font } },
      title: { display: !!g.title, text: g.title, color: colors.text, font: { size: s.fontSize + 4, weight: '600' } },
      subtitle: { display: !!g.subtitle, text: g.subtitle, color: colors.muted, font },
      tooltip: { enabled: true },
      // Paints the chart background so exported PNGs are not transparent.
      pnBackground: { color: colors.bg },
    },
    ...(scales ? { scales } : {}),
  }

  return { type: chartType, data, options, empty }
}

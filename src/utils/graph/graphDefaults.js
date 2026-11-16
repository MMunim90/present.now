import { uuid } from '../ids'
import { PALETTE } from './graphTheme'

// ---- Chart type catalogue -------------------------------------------------
// family decides the shape of the data and which editor is shown:
//   function  -> list of expressions in x (rendered by our SVG plotter)
//   category  -> labels + numeric datasets (Chart.js)
//   xy        -> datasets of {x,y[,r]} points (Chart.js scatter / bubble)
//   histogram -> raw numbers binned at render time (Chart.js bar)
export const GRAPH_TYPES = [
  { id: 'function', label: 'Function graph  y = f(x)', group: 'Mathematical', family: 'function' },
  { id: 'bar', label: 'Bar / Grouped bar', group: 'Statistical', family: 'category' },
  { id: 'line', label: 'Line / Multi-series line', group: 'Statistical', family: 'category' },
  { id: 'area', label: 'Area', group: 'Statistical', family: 'category' },
  { id: 'pie', label: 'Pie', group: 'Statistical', family: 'category' },
  { id: 'doughnut', label: 'Doughnut', group: 'Statistical', family: 'category' },
  { id: 'scatter', label: 'Scatter plot', group: 'Statistical', family: 'xy' },
  { id: 'bubble', label: 'Bubble', group: 'Statistical', family: 'xy' },
  { id: 'radar', label: 'Radar', group: 'Statistical', family: 'category' },
  { id: 'polarArea', label: 'Polar area', group: 'Statistical', family: 'category' },
  { id: 'horizontalBar', label: 'Horizontal bar', group: 'Other', family: 'category' },
  { id: 'stackedBar', label: 'Stacked bar', group: 'Other', family: 'category' },
  { id: 'histogram', label: 'Histogram', group: 'Other', family: 'histogram' },
  { id: 'mixed', label: 'Mixed (bar + line)', group: 'Other', family: 'category' },
]

export const TYPE_INFO = Object.fromEntries(GRAPH_TYPES.map((t) => [t.id, t]))

const PIE_LIKE = ['pie', 'doughnut', 'polarArea']

/** Which customisation options are meaningful for a chart type. */
export function getCapabilities(chartType) {
  const family = TYPE_INFO[chartType]?.family || 'category'
  const pieLike = PIE_LIKE.includes(chartType)
  const radial = chartType === 'radar' || chartType === 'polarArea'
  const cartesian = !pieLike && chartType !== 'radar'
  return {
    family,
    pieLike,
    radial,
    axisLabels: cartesian,
    grid: cartesian || radial,
    xRange: chartType === 'scatter' || chartType === 'bubble' || chartType === 'function',
    yRange: cartesian || radial,
    lineWidth: ['line', 'area', 'mixed', 'radar', 'function'].includes(chartType),
    pointSize: ['line', 'area', 'mixed', 'radar', 'scatter'].includes(chartType),
    aspect: chartType !== 'function',
    singleSeries: pieLike || chartType === 'histogram',
    bins: chartType === 'histogram',
  }
}

export const DEFAULT_VIEW = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 }

export const DEFAULT_SETTINGS = {
  xLabel: '',
  yLabel: '',
  showLegend: true,
  showGrid: true,
  background: '', // '' = follow the app theme
  fontSize: 12,
  lineWidth: 2,
  pointSize: 4,
  xMin: null,
  xMax: null,
  yMin: null,
  yMax: null,
  aspectRatio: 'fill', // 'fill' | '1' | '1.3333' | '1.7778' | '2'
  bins: 6,
}

export const ASPECT_OPTIONS = [
  { value: 'fill', label: 'Fill box' },
  { value: '1', label: '1 : 1' },
  { value: '1.3333', label: '4 : 3' },
  { value: '1.7778', label: '16 : 9' },
  { value: '2', label: '2 : 1' },
]

const uid = () => uuid().slice(0, 8)
const color = (i) => PALETTE[i % PALETTE.length]
const series = (label, data, i, extra = {}) => ({ id: uid(), label, data, color: color(i), ...extra })

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

// ---- Sample data ----------------------------------------------------------
const SAMPLES = {
  bar: () => ({
    title: 'Monthly Sales',
    labels: MONTHS,
    datasets: [series('2024', [120, 190, 150, 220, 180, 260], 0), series('2025', [140, 170, 190, 240, 210, 300], 1)],
  }),
  horizontalBar: () => ({
    title: 'Votes by Product',
    labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
    datasets: [series('Votes', [42, 31, 27, 18, 9], 0)],
  }),
  stackedBar: () => ({
    title: 'Revenue by Channel',
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [series('Online', [30, 40, 35, 50], 0), series('Retail', [20, 25, 30, 28], 1), series('Partners', [10, 12, 18, 20], 2)],
  }),
  line: () => ({
    title: 'Temperature Trend',
    labels: MONTHS,
    datasets: [series('City A', [4, 6, 11, 16, 21, 25], 0), series('City B', [8, 9, 12, 15, 18, 22], 1)],
  }),
  area: () => ({
    title: 'Website Visitors',
    labels: MONTHS,
    datasets: [series('Visitors', [320, 410, 380, 520, 610, 580], 0)],
  }),
  pie: () => ({
    title: 'Market Share',
    labels: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    datasets: [series('Share', [45, 25, 20, 10], 0)],
  }),
  doughnut: () => ({
    title: 'Budget Split',
    labels: ['Rent', 'Food', 'Transport', 'Savings'],
    datasets: [series('Budget', [40, 25, 15, 20], 0)],
  }),
  radar: () => ({
    title: 'Skill Profile',
    labels: ['Speed', 'Power', 'Range', 'Defense', 'Agility'],
    datasets: [series('Hero', [8, 6, 7, 5, 9], 0), series('Rival', [6, 8, 5, 7, 6], 1)],
  }),
  polarArea: () => ({
    title: 'Survey Responses',
    labels: ['Very good', 'Good', 'Neutral', 'Poor', 'Very poor'],
    datasets: [series('Responses', [14, 22, 10, 6, 3], 0)],
  }),
  mixed: () => ({
    title: 'Revenue vs Trend',
    labels: MONTHS,
    datasets: [series('Revenue', [120, 190, 150, 220, 180, 260], 0, { kind: 'bar' }), series('Trend', [130, 150, 170, 190, 210, 230], 1, { kind: 'line' })],
  }),
  scatter: () => ({
    title: 'Height vs Weight',
    datasets: [
      series(
        'Sample',
        [
          [150, 48], [155, 52], [158, 55], [162, 58], [165, 60], [168, 64],
          [170, 66], [173, 70], [175, 72], [178, 76], [181, 80], [185, 85],
        ].map(([x, y]) => ({ x, y })),
        0
      ),
    ],
  }),
  bubble: () => ({
    title: 'Cities: Population & Area',
    datasets: [
      series(
        'Cities',
        [
          { x: 10, y: 20, r: 8 }, { x: 25, y: 35, r: 14 }, { x: 40, y: 15, r: 6 },
          { x: 55, y: 45, r: 18 }, { x: 70, y: 30, r: 10 }, { x: 85, y: 55, r: 12 },
        ],
        0
      ),
    ],
  }),
  histogram: () => ({
    title: 'Exam Scores',
    datasets: [
      series(
        'Students',
        [52, 58, 61, 64, 65, 67, 68, 70, 71, 72, 72, 74, 75, 75, 76, 78, 79, 80, 81, 83, 84, 85, 88, 90, 92, 95],
        0
      ),
    ],
  }),
  function: () => ({
    title: 'Function Plot',
    functions: [
      { id: uid(), expr: 'x^2 / 4', color: color(0), visible: true },
      { id: uid(), expr: 'sin(x) * 3', color: color(1), visible: true },
    ],
    view: { ...DEFAULT_VIEW },
  }),
}

export function createDefaultGraphData(chartType = 'bar') {
  const type = TYPE_INFO[chartType] ? chartType : 'bar'
  return {
    chartType: type,
    subtitle: '',
    ...SAMPLES[type](),
    settings: { ...DEFAULT_SETTINGS },
  }
}

// ---- Switching chart type -------------------------------------------------
/**
 * Change chart type. Data is kept when both types share a data family and is
 * replaced with fresh sample data otherwise. Title, subtitle and every
 * customisation setting are always preserved.
 */
export function convertGraphType(graph, newType) {
  if (!TYPE_INFO[newType] || newType === graph.chartType) return graph
  const oldFamily = TYPE_INFO[graph.chartType]?.family
  const newFamily = TYPE_INFO[newType].family
  const fresh = createDefaultGraphData(newType)
  const keep = { subtitle: graph.subtitle, settings: graph.settings }
  const userTitle = graph.title && graph.title !== createDefaultGraphData(graph.chartType).title ? graph.title : fresh.title

  if (oldFamily !== newFamily) {
    return { ...fresh, ...keep, chartType: newType, title: userTitle }
  }
  if (newFamily === 'category') {
    let datasets = graph.datasets.map((d) => ({ ...d }))
    if (getCapabilities(newType).singleSeries) datasets = datasets.slice(0, 1)
    if (newType === 'mixed') {
      datasets = datasets.map((d, i) => ({ ...d, kind: i === 0 ? 'bar' : 'line' }))
      if (datasets.length === 1) {
        // A mixed chart needs a line series: derive a moving-average "Trend".
        const base = datasets[0].data
        const avg = base.map((_, i) => {
          const win = base.slice(Math.max(0, i - 1), i + 2).filter((v) => v !== null)
          return win.length ? Math.round((win.reduce((a, b) => a + b, 0) / win.length) * 100) / 100 : null
        })
        datasets.push({ id: uid(), label: 'Trend', data: avg, color: color(1), kind: 'line' })
      }
    }
    return { ...graph, chartType: newType, title: userTitle, datasets }
  }
  return { ...graph, chartType: newType, title: userTitle }
}

// ---- Normalisation (defence against missing / corrupted saved data) --------
const finite = (v) => typeof v === 'number' && Number.isFinite(v)
const numOrNull = (v) => (finite(v) ? v : null)
const str = (v, fallback = '') => (typeof v === 'string' ? v : fallback)

function normalizeSettings(raw) {
  const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) }
  s.xLabel = str(s.xLabel)
  s.yLabel = str(s.yLabel)
  s.background = str(s.background)
  s.showLegend = s.showLegend !== false
  s.showGrid = s.showGrid !== false
  s.fontSize = finite(s.fontSize) ? Math.min(32, Math.max(8, s.fontSize)) : DEFAULT_SETTINGS.fontSize
  s.lineWidth = finite(s.lineWidth) ? Math.min(12, Math.max(0.5, s.lineWidth)) : DEFAULT_SETTINGS.lineWidth
  s.pointSize = finite(s.pointSize) ? Math.min(20, Math.max(0, s.pointSize)) : DEFAULT_SETTINGS.pointSize
  s.bins = finite(s.bins) ? Math.min(100, Math.max(1, Math.round(s.bins))) : DEFAULT_SETTINGS.bins
  s.xMin = numOrNull(s.xMin)
  s.xMax = numOrNull(s.xMax)
  s.yMin = numOrNull(s.yMin)
  s.yMax = numOrNull(s.yMax)
  if (!ASPECT_OPTIONS.some((o) => o.value === s.aspectRatio)) s.aspectRatio = 'fill'
  return s
}

function normalizeView(raw) {
  const v = { ...DEFAULT_VIEW, ...(raw && typeof raw === 'object' ? raw : {}) }
  const ok = finite(v.xMin) && finite(v.xMax) && finite(v.yMin) && finite(v.yMax) && v.xMax > v.xMin && v.yMax > v.yMin
  return ok ? { xMin: v.xMin, xMax: v.xMax, yMin: v.yMin, yMax: v.yMax } : { ...DEFAULT_VIEW }
}

/** Always returns a complete, well-formed graph object — never throws. */
export function normalizeGraphData(raw) {
  const g = raw && typeof raw === 'object' ? raw : {}
  const chartType = TYPE_INFO[g.chartType] ? g.chartType : 'bar'
  const family = TYPE_INFO[chartType].family
  const out = {
    chartType,
    title: str(g.title),
    subtitle: str(g.subtitle),
    settings: normalizeSettings(g.settings),
  }

  if (family === 'function') {
    out.functions = (Array.isArray(g.functions) ? g.functions : []).map((f, i) => ({
      id: str(f?.id) || uid(),
      expr: str(f?.expr),
      color: str(f?.color) || color(i),
      visible: f?.visible !== false,
    }))
    out.view = normalizeView(g.view)
    return out
  }

  const rawSets = Array.isArray(g.datasets) ? g.datasets : []
  if (family === 'category') {
    out.labels = (Array.isArray(g.labels) ? g.labels : []).map((l) => (l === null || l === undefined ? '' : String(l)))
    out.datasets = rawSets.map((d, i) => {
      const data = Array.isArray(d?.data) ? d.data : []
      const ds = {
        id: str(d?.id) || uid(),
        label: str(d?.label, `Series ${i + 1}`),
        color: str(d?.color) || color(i),
        data: out.labels.map((_, j) => numOrNull(data[j])),
      }
      if (chartType === 'mixed') ds.kind = d?.kind === 'line' ? 'line' : 'bar'
      if (Array.isArray(d?.sliceColors)) ds.sliceColors = d.sliceColors.map((c) => str(c))
      return ds
    })
  } else if (family === 'xy') {
    out.datasets = rawSets.map((d, i) => ({
      id: str(d?.id) || uid(),
      label: str(d?.label, `Series ${i + 1}`),
      color: str(d?.color) || color(i),
      data: (Array.isArray(d?.data) ? d.data : [])
        .filter((p) => p && finite(p.x) && finite(p.y))
        .map((p) => ({ x: p.x, y: p.y, r: finite(p.r) && p.r > 0 ? p.r : 6 })),
    }))
  } else {
    // histogram: a single dataset of raw numbers
    const d = rawSets[0] || {}
    out.datasets = [
      {
        id: str(d.id) || uid(),
        label: str(d.label, 'Frequency'),
        color: str(d.color) || color(0),
        data: (Array.isArray(d.data) ? d.data : []).filter(finite),
      },
    ]
  }
  return out
}

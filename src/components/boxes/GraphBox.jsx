import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileCode, RotateCcw } from 'lucide-react'
import { saveAs } from 'file-saver'
import BaseBox from './BaseBox'
import IconButton from '../ui/IconButton'
import MathPlot from '../graph/MathPlot'
import GraphDataEditor from '../graph/GraphDataEditor'
import GraphStyleEditor from '../graph/GraphStyleEditor'
import { useDocumentStore } from '../../store/DocumentContext'
import { useElementSize } from '../../hooks/useElementSize'
import { useIsDark } from '../../hooks/useIsDark'
import { sanitizeFilename } from '../../services/export/exportPdf'
import { DEFAULT_VIEW, TYPE_INFO, getCapabilities, normalizeGraphData } from '../../utils/graph/graphDefaults'
import { resolveGraphColors } from '../../utils/graph/graphTheme'

// Chart.js is only downloaded once a statistical graph is actually on the canvas.
const StatChart = lazy(() => import('../graph/StatChart'))

const TABS = [
  { id: 'graph', label: 'Graph' },
  { id: 'data', label: 'Data' },
  { id: 'style', label: 'Style' },
]

function GraphTabs({ panel, setPanel, typeLabel }) {
  return (
    <div role="tablist" aria-label="Graph editor" className="flex items-center gap-1 border-b border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={panel === t.id}
          onClick={() => setPanel(t.id)}
          className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 ${
            panel === t.id
              ? 'bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
          }`}
        >
          {t.label}
        </button>
      ))}
      <span className="ml-auto hidden truncate pl-2 text-[11px] text-gray-400 sm:inline">{typeLabel}</span>
    </div>
  )
}

// Measures the available area and lays the chart out inside it (optionally at a fixed aspect ratio).
function GraphViewport({ graph, colors, interactive, rendererRef, onViewChange }) {
  const [ref, size] = useElementSize({ width: 0, height: 0 })
  const isFn = graph.chartType === 'function'
  const caps = getCapabilities(graph.chartType)
  const ratio = caps.aspect && graph.settings.aspectRatio !== 'fill' ? parseFloat(graph.settings.aspectRatio) : null

  let w = size.width
  let h = size.height
  if (ratio && w > 0 && h > 0) {
    if (w / h > ratio) w = h * ratio
    else h = w / ratio
  }
  w = Math.floor(w)
  h = Math.floor(h)

  return (
    <div ref={ref} className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden" style={{ background: colors.bg }}>
      {w > 20 && h > 20 &&
        (isFn ? (
          <MathPlot ref={rendererRef} graph={graph} colors={colors} width={w} height={h} interactive={interactive} onViewChange={onViewChange} />
        ) : (
          <div style={{ width: w, height: h }}>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center text-xs" style={{ color: colors.muted }}>Loading chart…</div>}>
              <StatChart ref={rendererRef} graph={graph} colors={colors} />
            </Suspense>
          </div>
        ))}
    </div>
  )
}

export default function GraphBox({ box, pageRef }) {
  const { updateBox, selectedId, expandedId, beginTransientEdit, endTransientEdit } = useDocumentStore()
  const selected = selectedId === box.id
  const expanded = expandedId === box.id
  const isDark = useIsDark()

  // Always render from a normalised copy so missing/corrupted saved data can never crash the box.
  const graph = useMemo(() => normalizeGraphData(box.graphData), [box.graphData])
  const colors = useMemo(() => resolveGraphColors(graph.settings.background, isDark), [graph.settings.background, isDark])
  const isFn = graph.chartType === 'function'

  const [panel, setPanel] = useState('graph')
  const [notice, setNotice] = useState(null)
  const rendererRef = useRef(null)

  // The editor is part of the selected state; deselecting returns to the clean graph view.
  const showEditor = panel !== 'graph' && (selected || expanded)
  const graphVisible = !showEditor || expanded // expanded mode shows graph + editor side by side

  // ---- persistence ------------------------------------------------------------
  // A whole editing session (many keystrokes) becomes ONE undo step, and nothing
  // re-renders the canvas more than necessary: updates are applied with
  // record:false and the pre-edit snapshot is committed when the session ends.
  const editingRef = useRef(false)
  const history = useRef({})
  history.current = { beginTransientEdit, endTransientEdit }

  const commitGraph = useCallback(
    (next) => {
      if (!editingRef.current) {
        editingRef.current = true
        history.current.beginTransientEdit()
      }
      updateBox(box.id, { graphData: next }, { record: false })
    },
    [box.id, updateBox]
  )

  const endEditing = useCallback(() => {
    if (editingRef.current) {
      editingRef.current = false
      history.current.endTransientEdit()
    }
  }, [])

  useEffect(() => endEditing, [endEditing]) // finish the session on unmount
  useEffect(() => {
    if (!showEditor) endEditing()
  }, [showEditor, endEditing])

  // Pan / zoom of a function graph: stored as part of the graph so it survives reload.
  const handleViewChange = useCallback(
    (view) => updateBox(box.id, (b) => ({ graphData: { ...normalizeGraphData(b.graphData), view } }), { record: false }),
    [box.id, updateBox]
  )
  const resetView = () => handleViewChange({ ...DEFAULT_VIEW })

  // ---- export -------------------------------------------------------------------
  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const baseName = sanitizeFilename(graph.title || box.label || 'graph')

  const exportPNG = async () => {
    try {
      const blob = await rendererRef.current?.toPNGBlob()
      if (!blob) throw new Error('There is no graph to export yet.')
      saveAs(blob, `${baseName}.png`)
    } catch (err) {
      console.error(err)
      setNotice(err?.message || 'Could not export the graph as PNG.')
    }
  }

  const exportSVG = () => {
    try {
      const svg = rendererRef.current?.toSVGString?.()
      if (!svg) throw new Error('There is no graph to export yet.')
      saveAs(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${baseName}.svg`)
    } catch (err) {
      console.error(err)
      setNotice(err?.message || 'Could not export the graph as SVG.')
    }
  }

  // Delete/Backspace inside a <select> would otherwise reach the global
  // "delete selected box" shortcut (it only exempts inputs/textareas).
  const guardKeys = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') e.stopPropagation()
  }

  return (
    <BaseBox
      box={box}
      pageRef={pageRef}
      extraControls={
        <>
          {isFn && <IconButton icon={RotateCcw} label="Reset view (drag to pan, scroll to zoom)" size="sm" onClick={resetView} disabled={!graphVisible} />}
          <IconButton icon={Download} label="Export graph as PNG" size="sm" onClick={exportPNG} disabled={!graphVisible} />
          {isFn && <IconButton icon={FileCode} label="Export graph as SVG" size="sm" onClick={exportSVG} disabled={!graphVisible} />}
        </>
      }
      secondaryToolbar={<GraphTabs panel={panel} setPanel={setPanel} typeLabel={TYPE_INFO[graph.chartType].label} />}
    >
      <div className="relative flex h-full min-h-[160px] w-full overflow-hidden">
        {graphVisible && (
          <GraphViewport graph={graph} colors={colors} interactive={selected && !showEditor} rendererRef={rendererRef} onViewChange={handleViewChange} />
        )}

        {showEditor && (
          <div
            onKeyDown={guardKeys}
            onBlur={(e) => {
              // Leaving the editor entirely ends the editing session (one undo step).
              if (!e.currentTarget.contains(e.relatedTarget)) endEditing()
            }}
            className={`min-h-0 overflow-y-auto bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 ${
              expanded ? 'w-[22rem] max-w-[45%] shrink-0 border-l border-gray-200 dark:border-gray-700' : 'h-full w-full'
            }`}
          >
            {panel === 'data' ? <GraphDataEditor graph={graph} onChange={commitGraph} /> : <GraphStyleEditor graph={graph} onChange={commitGraph} />}
          </div>
        )}

        {notice && (
          <div role="alert" className="absolute bottom-0 left-0 right-0 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 dark:bg-red-900/50 dark:text-red-300">
            {notice}
          </div>
        )}
      </div>
    </BaseBox>
  )
}

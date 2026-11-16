import React, { useEffect, useMemo } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { useDocumentStore } from '../../store/DocumentContext'
import TextBox from '../boxes/TextBox'
import ImageBox from '../boxes/ImageBox'
import VideoBox from '../boxes/VideoBox'
import CodeBox from '../boxes/CodeBox'
import OutputBox from '../boxes/OutputBox'
import GraphBox from '../boxes/GraphBox'
import ConnectionLayer from './ConnectionLayer'
import { useElementSize } from '../../hooks/useElementSize'
import { getContentBounds } from '../../utils/canvasSize'
import { nextZoom } from '../../utils/formatting'

const BOX_COMPONENTS = {
  text: TextBox,
  image: ImageBox,
  video: VideoBox,
  code: CodeBox,
  output: OutputBox,
  graph: GraphBox,
}

export default function Canvas() {
  const { doc, setSelectedId, setExpandedId, setSelectedConnectionId, canvasZoom, setCanvasZoom } = useDocumentStore()

  // `workspaceRef` measures the *available* scrollable workspace (viewport-driven).
  // `pageRef` points at the zoomable content layer (see render below) — the
  // element whose bounding rect box drag/resize and connection-point math
  // are computed against.
  const [workspaceRef, workspaceSize] = useElementSize({ width: 1120, height: 780 })
  const pageRef = React.useRef(null)

  const contentBounds = useMemo(() => getContentBounds(doc.boxes), [doc.boxes])

  // Content-aware canvas: only ever grows beyond the workspace when the
  // boxes actually require the extra space; otherwise it fills the
  // available viewport so small/empty pages never carry unnecessary
  // horizontal scrolling on small devices. This is the *logical* size and
  // is completely independent of canvasZoom (a purely visual transform
  // applied below) — zoom never changes these numbers.
  const pageWidth = Math.max(workspaceSize.width, contentBounds.width)
  const pageHeight = Math.max(workspaceSize.height, contentBounds.height)

  // Ctrl+Wheel canvas zoom. Attached as a *native* (non-passive) listener —
  // React's synthetic onWheel is passive for wheel events, so
  // e.preventDefault() would silently fail to stop the browser's own
  // Ctrl+Wheel page-zoom otherwise. Scoped to this one workspace element
  // only, so wheel events over the header/footer/elsewhere are never
  // touched. Plain wheel (no Ctrl) is ignored entirely here, leaving the
  // existing native scroll behavior completely untouched.
  useEffect(() => {
    const el = workspaceRef.current
    if (!el) return undefined

    const handleWheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()

      const rect = el.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top
      const direction = e.deltaY < 0 ? 1 : -1

      setCanvasZoom((prevZoom) => {
        const newZoom = nextZoom(prevZoom, direction)
        if (newZoom === prevZoom) return prevZoom

        // Zoom toward the pointer: keep the point under the cursor fixed by
        // compensating the workspace's own scroll position. This only ever
        // touches the workspace's native scrollLeft/scrollTop — box
        // coordinates and the canvas's logical size are never touched.
        const oldScale = prevZoom / 100
        const newScale = newZoom / 100
        const unscaledX = (el.scrollLeft + offsetX) / oldScale
        const unscaledY = (el.scrollTop + offsetY) / oldScale
        el.scrollLeft = unscaledX * newScale - offsetX
        el.scrollTop = unscaledY * newScale - offsetY

        return newZoom
      })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [workspaceRef, setCanvasZoom])

  const handleBackgroundClick = () => {
    setSelectedId(null)
    setExpandedId(null)
    setSelectedConnectionId(null)
  }

  return (
    <div ref={workspaceRef} className="flex-1 overflow-auto bg-gray-100 px-4 py-8 dark:bg-gray-950 sm:px-8">
      {/* Outer canvas container: fixed logical size, never transformed. Its
          border/background/rounded corners represent the canvas boundary
          itself, which must stay visually the same size at every zoom
          level — only the content layer inside it scales. */}
      <div
        id="present-now-page"
        onMouseDown={handleBackgroundClick}
        className="relative mx-auto rounded-2xl border border-gray-200 bg-white shadow-soft transition-colors dark:border-gray-800 dark:bg-gray-900"
        style={{ width: pageWidth, height: pageHeight }}
      >
        {doc.boxes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-gray-400 dark:text-gray-600">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
              <LayoutTemplate size={26} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Start creating your page</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">Add a Text, Image, Video, Code, or Output box.</p>
            </div>
          </div>
        )}

        {/* Zoomable content layer: exactly overlays the canvas's own box
            (absolute inset-0 within the relatively-positioned canvas above),
            so its pre-transform coordinate space is identical to the
            canvas's own — box.x/y math, drag/resize, and connection-point
            math (all keyed off `pageRef`) are completely unaffected by this
            split. Only this layer is scaled; the canvas boundary above never is. */}
        <div ref={pageRef} className="absolute inset-0" style={{ transform: `scale(${canvasZoom / 100})`, transformOrigin: 'top left' }}>
          <ConnectionLayer width={pageWidth} height={pageHeight} />

          {doc.boxes.map((box) => {
            const Component = BOX_COMPONENTS[box.type]
            if (!Component) return null
            return <Component key={box.id} box={box} pageRef={pageRef} />
          })}
        </div>
      </div>
    </div>
  )
}

import React, { useMemo } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { useDocumentStore } from '../../store/DocumentContext'
import TextBox from '../boxes/TextBox'
import ImageBox from '../boxes/ImageBox'
import VideoBox from '../boxes/VideoBox'
import CodeBox from '../boxes/CodeBox'
import OutputBox from '../boxes/OutputBox'
import ConnectionLayer from './ConnectionLayer'
import { useElementSize } from '../../hooks/useElementSize'
import { getContentBounds } from '../../utils/canvasSize'

const BOX_COMPONENTS = {
  text: TextBox,
  image: ImageBox,
  video: VideoBox,
  code: CodeBox,
  output: OutputBox,
}

export default function Canvas() {
  const { doc, setSelectedId, setExpandedId, setSelectedConnectionId } = useDocumentStore()

  // `workspaceRef` measures the *available* scrollable workspace (viewport-driven).
  // `pageRef` is the actual document/canvas surface, sized from both the
  // workspace and the content's own footprint — never forced to a fixed width.
  const [workspaceRef, workspaceSize] = useElementSize({ width: 1120, height: 780 })
  const pageRef = React.useRef(null)

  const contentBounds = useMemo(() => getContentBounds(doc.boxes), [doc.boxes])

  // Content-aware canvas: only ever grows beyond the workspace when the
  // boxes actually require the extra space; otherwise it fills the
  // available viewport so small/empty pages never carry unnecessary
  // horizontal scrolling on small devices.
  const pageWidth = Math.max(workspaceSize.width, contentBounds.width)
  const pageHeight = Math.max(workspaceSize.height, contentBounds.height)

  const handleBackgroundClick = () => {
    setSelectedId(null)
    setExpandedId(null)
    setSelectedConnectionId(null)
  }

  return (
    <div ref={workspaceRef} className="flex-1 overflow-auto bg-gray-100 px-4 py-8 dark:bg-gray-950 sm:px-8">
      <div
        id="present-now-page"
        ref={pageRef}
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

        <ConnectionLayer width={pageWidth} height={pageHeight} />

        {doc.boxes.map((box) => {
          const Component = BOX_COMPONENTS[box.type]
          if (!Component) return null
          return <Component key={box.id} box={box} pageRef={pageRef} />
        })}
      </div>
    </div>
  )
}

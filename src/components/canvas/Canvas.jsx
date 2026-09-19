import React, { useRef } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { useDocumentStore } from '../../store/DocumentContext'
import TextBox from '../boxes/TextBox'
import ImageBox from '../boxes/ImageBox'
import VideoBox from '../boxes/VideoBox'
import CodeBox from '../boxes/CodeBox'
import OutputBox from '../boxes/OutputBox'
import { PAGE_MIN_HEIGHT } from '../../utils/factories'

const BOX_COMPONENTS = {
  text: TextBox,
  image: ImageBox,
  video: VideoBox,
  code: CodeBox,
  output: OutputBox,
}

export default function Canvas({ pageWidth }) {
  const { doc, setSelectedId, setExpandedId } = useDocumentStore()
  const pageRef = useRef(null)

  const handleBackgroundClick = () => {
    setSelectedId(null)
    setExpandedId(null)
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-100 px-4 py-8 dark:bg-gray-950 sm:px-8">
      <div
        id="present-now-page"
        ref={pageRef}
        onMouseDown={handleBackgroundClick}
        className="relative mx-auto rounded-2xl border border-gray-200 bg-white shadow-soft transition-colors dark:border-gray-800 dark:bg-gray-900"
        style={{ width: pageWidth, minHeight: PAGE_MIN_HEIGHT, maxWidth: '100%' }}
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

        {doc.boxes.map((box) => {
          const Component = BOX_COMPONENTS[box.type]
          if (!Component) return null
          return <Component key={box.id} box={box} pageRef={pageRef} />
        })}
      </div>
    </div>
  )
}

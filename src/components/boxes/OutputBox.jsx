import React, { useState } from 'react'
import { Eraser, Clipboard, Check, Terminal } from 'lucide-react'
import BaseBox from './BaseBox'
import IconButton from '../ui/IconButton'
import { useDocumentStore } from '../../store/DocumentContext'

export default function OutputBox({ box, pageRef }) {
  const { updateBox } = useDocumentStore()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(box.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.warn('Clipboard copy failed', err)
    }
  }

  const handleClear = () => updateBox(box.id, { content: '' })

  return (
    <BaseBox
      box={box}
      pageRef={pageRef}
      extraControls={
        <>
          <IconButton icon={Eraser} label="Clear output" size="sm" onClick={handleClear} />
          <IconButton icon={copied ? Check : Clipboard} label={copied ? 'Copied!' : 'Copy output'} size="sm" onClick={handleCopy} />
        </>
      }
    >
      <div className="flex h-full min-h-[100px] w-full flex-col bg-[#fafafa] dark:bg-gray-900/60">
        <div className="flex items-center gap-1.5 border-b border-gray-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Terminal size={12} /> Output
        </div>
        <textarea
          value={box.content}
          onChange={(e) => updateBox(box.id, { content: e.target.value }, { record: false })}
          onBlur={(e) => updateBox(box.id, { content: e.target.value })}
          placeholder="Output will appear here…"
          aria-label="Output content"
          className="min-h-0 flex-1 resize-none border-none bg-transparent p-3 font-mono text-[13px] leading-relaxed text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-300"
        />
      </div>
    </BaseBox>
  )
}

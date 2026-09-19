import React, { useRef, useState } from 'react'
import { Clipboard, Check } from 'lucide-react'
import BaseBox from './BaseBox'
import IconButton from '../ui/IconButton'
import CodeEditor from '../editor/CodeEditor'
import { useDocumentStore } from '../../store/DocumentContext'

export const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
]

export default function CodeBox({ box, pageRef }) {
  const { updateBox, beginTransientEdit, endTransientEdit } = useDocumentStore()
  const [copied, setCopied] = useState(false)
  const editingRef = useRef(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(box.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.warn('Clipboard copy failed', err)
    }
  }

  const handleCodeChange = (code) => {
    if (!editingRef.current) {
      editingRef.current = true
      beginTransientEdit()
    }
    updateBox(box.id, { content: code }, { record: false })
  }

  const handleBlur = () => {
    if (editingRef.current) {
      editingRef.current = false
      endTransientEdit()
    }
  }

  return (
    <BaseBox
      box={box}
      pageRef={pageRef}
      extraControls={
        <>
          <select
            aria-label="Programming language"
            value={box.language}
            onChange={(e) => updateBox(box.id, { language: e.target.value })}
            className="h-7 rounded-md border border-gray-200 bg-white px-1.5 text-xs font-medium text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <IconButton icon={copied ? Check : Clipboard} label={copied ? 'Copied!' : 'Copy code'} size="sm" onClick={handleCopyCode} />
        </>
      }
    >
      <div className="h-full min-h-[160px] w-full overflow-auto" onBlur={handleBlur}>
        <CodeEditor code={box.content} language={box.language} onChange={handleCodeChange} minHeight={160} />
      </div>
    </BaseBox>
  )
}

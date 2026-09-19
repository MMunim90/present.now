import React from 'react'
import { Plus, Type, ImageIcon, Video, Code2, Terminal } from 'lucide-react'
import Dropdown from '../ui/Dropdown'

const OPTIONS = [
  { type: 'text', label: 'Text', description: 'Headings & paragraphs', icon: Type },
  { type: 'image', label: 'Image', description: 'Upload a picture', icon: ImageIcon },
  { type: 'video', label: 'Video', description: 'URL or local file', icon: Video },
  { type: 'code', label: 'Code', description: 'Syntax-highlighted editor', icon: Code2 },
  { type: 'output', label: 'Output', description: 'Editable result panel', icon: Terminal },
]

export default function AddBoxMenu({ onAdd }) {
  return (
    <Dropdown
      trigger={(toggle, open) => (
        <button
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent-500 px-3 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add content</span>
        </button>
      )}
      width="w-60"
    >
      {(close) => (
        <div className="space-y-0.5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.type}
              role="menuitem"
              onClick={() => {
                onAdd(opt.type)
                close()
              }}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-300">
                <opt.icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">{opt.label}</span>
                <span className="block text-xs text-gray-400">{opt.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  )
}

import React from 'react'
import { HelpCircle } from 'lucide-react'
import Dropdown from '../ui/Dropdown'
import IconButton from '../ui/IconButton'

const SHORTCUTS = [
  ['Save', 'Ctrl + S'],
  ['Undo', 'Ctrl + Z'],
  ['Redo', 'Ctrl + Shift + Z'],
  ['Duplicate box', 'Ctrl + D'],
  ['Copy box', 'Ctrl + C'],
  ['Delete box', 'Delete'],
  ['Exit / Deselect', 'Esc'],
]

export default function HelpMenu() {
  return (
    <Dropdown
      align="right"
      width="w-64"
      trigger={(toggle, open) => <IconButton icon={HelpCircle} label="Help & shortcuts" onClick={toggle} active={open} />}
    >
      <div className="p-1">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Keyboard shortcuts</p>
        <ul className="mt-1 space-y-1 px-2 pb-2">
          {SHORTCUTS.map(([label, keys]) => (
            <li key={label} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <span>{label}</span>
              <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-100 px-2 pt-2 text-[11px] text-gray-400 dark:border-gray-700">
          present.now stores everything locally in your browser. Nothing is uploaded to a server.
        </div>
      </div>
    </Dropdown>
  )
}

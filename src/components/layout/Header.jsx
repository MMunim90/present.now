import React, { useState } from 'react'
import { FilePlus, Undo2, Redo2, Trash2, Sun, Moon, Download, FileStack, Pencil } from 'lucide-react'
import IconButton from '../ui/IconButton'
import AddBoxMenu from './AddBoxMenu'
import HelpMenu from './HelpMenu'
import SaveStatus from './SaveStatus'
import { useDocumentStore } from '../../store/DocumentContext'

export default function Header({
  theme,
  onToggleTheme,
  onOpenExport,
  onOpenDocuments,
  onRequestDeleteAll,
  onRequestNewDocument,
}) {
  const { doc, addBox, undo, redo, canUndo, canRedo, saveStatus, renameCurrentDocument } = useDocumentStore()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(doc.name)

  const startEdit = () => {
    setNameDraft(doc.name)
    setEditingName(true)
  }

  const commitName = () => {
    renameCurrentDocument(nameDraft.trim() || 'Untitled')
    setEditingName(false)
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900 sm:px-4">
      <div className="flex items-center gap-2 pr-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-sm font-bold text-white">p.</div>
        <span className="hidden text-[15px] font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:inline">
          present<span className="text-accent-500">.now</span>
        </span>
      </div>

      <div className="h-6 w-px shrink-0 bg-gray-200 dark:bg-gray-700" />

      <div className="flex min-w-0 items-center gap-1 px-1">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && commitName()}
            aria-label="Document name"
            className="h-8 w-40 min-w-0 rounded-md border border-accent-300 bg-white px-2 text-sm outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        ) : (
          <button
            onClick={startEdit}
            className="group flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Rename document"
          >
            <span className="max-w-[10rem] truncate sm:max-w-[16rem]">{doc.name}</span>
            <Pencil size={12} className="shrink-0 text-gray-300 group-hover:text-gray-400" />
          </button>
        )}
      </div>

      <div className="hidden items-center gap-0.5 md:flex">
        <IconButton icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} />
        <IconButton icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} />
      </div>

      <div className="mx-1 hidden h-6 w-px shrink-0 bg-gray-200 dark:bg-gray-700 md:block" />

      <AddBoxMenu onAdd={addBox} />

      <div className="ml-auto flex items-center gap-1">
        <div className="hidden lg:block">
          <SaveStatus status={saveStatus} />
        </div>

        <div className="mx-1 hidden h-6 w-px shrink-0 bg-gray-200 dark:bg-gray-700 sm:block" />

        <IconButton icon={FilePlus} label="New document" onClick={onRequestNewDocument} />
        <IconButton icon={FileStack} label="Open document" onClick={onOpenDocuments} />
        <IconButton icon={Trash2} label="Delete all boxes" onClick={onRequestDeleteAll} disabled={doc.boxes.length === 0} />

        <div className="mx-1 h-6 w-px shrink-0 bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={onOpenExport}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Download size={15} /> <span className="hidden sm:inline">Export</span>
        </button>

        <IconButton icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={onToggleTheme} />
        <HelpMenu />
      </div>
    </header>
  )
}

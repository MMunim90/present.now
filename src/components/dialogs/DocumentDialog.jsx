import React, { useEffect, useState } from 'react'
import { X, FileStack, Pencil, Trash2, Check, FilePlus2 } from 'lucide-react'
import { getDocumentIndex, deleteDocument as deleteDocFromStorage } from '../../services/storage/documentStorage'
import { formatRelativeTime } from '../../utils/formatting'
import ConfirmDialog from './ConfirmDialog'

export default function DocumentDialog({ open, onClose, activeDocId, onOpenDocument, onRenameDocument, onNewDocument }) {
  const [items, setItems] = useState([])
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  useEffect(() => {
    if (open) setItems(getDocumentIndex())
  }, [open])

  if (!open) return null

  const refresh = () => setItems(getDocumentIndex())

  const startRename = (item) => {
    setRenamingId(item.id)
    setRenameValue(item.name)
  }

  const commitRename = (id) => {
    const name = renameValue.trim() || 'Untitled'
    onRenameDocument(id, name)
    setRenamingId(null)
    refresh()
  }

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    deleteDocFromStorage(pendingDeleteId)
    setPendingDeleteId(null)
    refresh()
    if (pendingDeleteId === activeDocId) {
      onNewDocument()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 animate-fade-in backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="documents-dialog-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-white shadow-pop animate-scale-in dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FileStack size={16} className="text-gray-400" />
              <h2 id="documents-dialog-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Recent documents
              </h2>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-400">No saved documents yet.</p>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`group flex items-center gap-2 rounded-xl p-2.5 transition-colors ${
                      item.id === activeDocId ? 'bg-accent-50 dark:bg-accent-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {renamingId === item.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitRename(item.id)}
                        onBlur={() => commitRename(item.id)}
                        aria-label="Document name"
                        className="min-w-0 flex-1 rounded-md border border-accent-300 bg-white px-2 py-1 text-sm outline-none dark:bg-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      <button className="min-w-0 flex-1 text-left" onClick={() => onOpenDocument(item.id)}>
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{item.name || 'Untitled'}</p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(item.updatedAt)}</p>
                      </button>
                    )}

                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {renamingId === item.id ? (
                        <button
                          onClick={() => commitRename(item.id)}
                          aria-label="Save name"
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-accent-600 dark:hover:bg-gray-600"
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => startRename(item)}
                          aria-label={`Rename ${item.name}`}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-600"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setPendingDeleteId(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 p-3 dark:border-gray-700">
            <button
              onClick={onNewDocument}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-accent-400 hover:text-accent-600 dark:border-gray-600 dark:text-gray-400"
            >
              <FilePlus2 size={15} /> New document
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this document?"
        description="This will permanently remove the document from local storage. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  )
}

import React, { useState } from 'react'
import { FileText, Presentation, FileType2, Loader2, X, AlertCircle } from 'lucide-react'
import { exportToPdf } from '../../services/export/exportPdf'
import { exportToPptx } from '../../services/export/exportPptx'
import { exportToDocx } from '../../services/export/exportDocx'

const FORMATS = [
  { id: 'pdf', label: 'Export as PDF', description: 'Best for sharing & printing', icon: FileText, verb: 'Generating PDF…' },
  { id: 'pptx', label: 'Export as PPTX', description: 'One slide, PowerPoint format', icon: Presentation, verb: 'Generating PPTX…' },
  { id: 'docx', label: 'Export as DOCX', description: 'Editable Word document', icon: FileType2, verb: 'Generating DOCX…' },
]

export default function ExportDialog({ open, onClose, doc, pageWidth }) {
  const [busy, setBusy] = useState(null) // format id currently exporting
  const [error, setError] = useState(null)

  if (!open) return null

  const runExport = async (format) => {
    setError(null)
    setBusy(format)
    try {
      if (doc.boxes.length === 0) {
        throw new Error('Add some content to the page before exporting.')
      }
      if (format === 'pdf') await exportToPdf(doc)
      if (format === 'pptx') await exportToPptx(doc, pageWidth)
      if (format === 'docx') await exportToDocx(doc)
      setBusy(null)
      onClose()
    } catch (err) {
      console.error('Export failed', err)
      setBusy(null)
      setError(err?.message || 'Export failed. Please try again.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 animate-fade-in backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-pop animate-scale-in dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="export-dialog-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Export document
          </h2>
          <button
            aria-label="Close export dialog"
            onClick={() => !busy && onClose()}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          {FORMATS.map((f) => {
            const isBusy = busy === f.id
            return (
              <button
                key={f.id}
                disabled={!!busy}
                onClick={() => runExport(f.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-colors hover:border-accent-300 hover:bg-accent-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:hover:border-accent-700 dark:hover:bg-accent-900/20"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {isBusy ? <Loader2 size={18} className="animate-spin" /> : <f.icon size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{isBusy ? f.verb : f.label}</p>
                  <p className="text-xs text-gray-400">{f.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

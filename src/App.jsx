import React, { useMemo, useState } from 'react'
import { DocumentProvider, useDocumentStore } from './store/DocumentContext'
import { useTheme } from './hooks/useTheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Canvas from './components/canvas/Canvas'
import ConfirmDialog from './components/dialogs/ConfirmDialog'
import ExportDialog from './components/dialogs/ExportDialog'
import DocumentDialog from './components/dialogs/DocumentDialog'
import * as documentStorage from './services/storage/documentStorage'
import { getContentBounds } from './utils/canvasSize'

function AppShell() {
  const { theme, toggleTheme } = useTheme()
  const {
    doc,
    selectedId,
    setSelectedId,
    expandedId,
    setExpandedId,
    deleteBox,
    copyBox,
    deleteAllBoxes,
    undo,
    redo,
    newDocument,
    openDocument,
  } = useDocumentStore()

  // Export scaling is based on the content's own bounding box (what the
  // boxes actually occupy), not the potentially much larger visual canvas
  // that fills a wide viewport — this keeps exported layouts tight around
  // the real content regardless of how the on-screen canvas has grown.
  const exportPageWidth = useMemo(() => {
    const bounds = getContentBounds(doc.boxes)
    return bounds.width || 1120
  }, [doc.boxes])

  const [exportOpen, setExportOpen] = useState(false)
  const [documentsOpen, setDocumentsOpen] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [confirmNewDoc, setConfirmNewDoc] = useState(false)

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onSave: () => {
      try {
        documentStorage.saveDocument({ ...doc, updatedAt: new Date().toISOString() })
      } catch (err) {
        console.error(err)
      }
    },
    onDeleteSelected: () => selectedId && deleteBox(selectedId),
    onCopySelected: () => selectedId && copyBox(selectedId),
    onDuplicateSelected: () => selectedId && copyBox(selectedId),
    onEscape: () => {
      if (expandedId) setExpandedId(null)
      else if (selectedId) setSelectedId(null)
    },
    hasSelection: !!selectedId,
  })

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenExport={() => setExportOpen(true)}
        onOpenDocuments={() => setDocumentsOpen(true)}
        onRequestDeleteAll={() => setConfirmDeleteAll(true)}
        onRequestNewDocument={() => setConfirmNewDoc(true)}
      />

      <Canvas />

      <Footer />

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} doc={doc} pageWidth={exportPageWidth} />

      <DocumentDialog
        open={documentsOpen}
        onClose={() => setDocumentsOpen(false)}
        activeDocId={doc.id}
        onOpenDocument={(id) => {
          openDocument(id)
          setDocumentsOpen(false)
        }}
        onRenameDocument={(id, name) => documentStorage.renameDocument(id, name)}
        onNewDocument={() => {
          newDocument()
          setDocumentsOpen(false)
        }}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        title="Delete all boxes?"
        description="This will remove all content from the current page. This action cannot be undone."
        confirmLabel="Delete All"
        onConfirm={() => {
          deleteAllBoxes()
          setConfirmDeleteAll(false)
        }}
        onCancel={() => setConfirmDeleteAll(false)}
      />

      <ConfirmDialog
        open={confirmNewDoc}
        title="Start a new document?"
        description="Your current document is already saved locally, so you can always come back to it from Recent Documents."
        confirmLabel="New Document"
        danger={false}
        onConfirm={() => {
          newDocument()
          setConfirmNewDoc(false)
        }}
        onCancel={() => setConfirmNewDoc(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <DocumentProvider>
      <AppShell />
    </DocumentProvider>
  )
}

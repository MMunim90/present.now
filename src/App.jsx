import { useEffect, useRef, useState } from 'react'
import Header from './components/layout/Header'
import Workspace from './components/workspace/Workspace'
import Footer from './components/layout/Footer'
import DocumentManager from './components/documents/DocumentManager'
import { createBox } from './lib/document'
import { documentStorage } from './services/storage/documentStorage'
import { settingsStorage } from './services/storage/settingsStorage'
import { mediaStorage } from './services/storage/mediaStorage'
import { exportDocx, exportPdf, exportPptx } from './services/export/exportService'

const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const touch = (pageDocument) => ({ ...pageDocument, updatedAt: new Date().toISOString() })

function loadInitialState() {
  const activeId = settingsStorage.getActiveDocumentId()
  const saved = activeId && documentStorage.get(activeId)
  const migrated = saved || documentStorage.migrateLegacy()
  return migrated ? { document: migrated, needsSave: false } : { document: documentStorage.create(), needsSave: true }
}

export default function App() {
  const [initialState] = useState(loadInitialState)
  const [pageDocument, setPageDocument] = useState(initialState.document)
  const [theme, setTheme] = useState(() => initialState.document.theme || settingsStorage.getTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [selectedBoxId, setSelectedBoxId] = useState(null)
  const [saveStatus, setSaveStatus] = useState(initialState.needsSave ? 'Saving...' : 'Saved locally')
  const [exportStatus, setExportStatus] = useState('')
  const [documents, setDocuments] = useState(() => documentStorage.list())
  const [isDocumentManagerOpen, setDocumentManagerOpen] = useState(false)
  const [isDirty, setDirty] = useState(initialState.needsSave)
  const saveTimer = useRef(null)
  const documentRef = useRef(initialState.document)
  const undoStack = useRef([])
  const redoStack = useRef([])
  const refreshDocuments = () => setDocuments(documentStorage.list())

  const saveNow = (value = documentRef.current) => {
    try {
      const saved = documentStorage.save(value)
      if (!settingsStorage.setActiveDocumentId(saved.id)) throw new Error('Unable to save local settings')
      documentRef.current = saved
      setDirty(false)
      setSaveStatus('Saved locally')
      refreshDocuments()
      return true
    } catch {
      setSaveStatus('Unable to save locally')
      return false
    }
  }

  useEffect(() => {
    globalThis.document.documentElement.classList.toggle('dark', theme === 'dark')
    globalThis.document.documentElement.style.colorScheme = theme
    if (!settingsStorage.setTheme(theme)) setSaveStatus('Unable to save locally')
  }, [theme])

  useEffect(() => {
    if (!isDirty) return undefined
    setSaveStatus('Saving...')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNow(documentRef.current), 650)
    return () => clearTimeout(saveTimer.current)
  }, [pageDocument, isDirty])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const updateDocument = (updater) => setPageDocument((current) => {
    undoStack.current = [...undoStack.current.slice(-49), current]
    redoStack.current = []
    const next = touch(updater(current))
    documentRef.current = next
    setDirty(true)
    return next
  })
  const addBox = (type) => { const box = createBox(type, documentRef.current.boxes.length); updateDocument((current) => ({ ...current, boxes: [...current.boxes, box] })); setSelectedBoxId(box.id) }
  const updateBox = (id, content, metadata) => updateDocument((current) => ({ ...current, boxes: current.boxes.map((box) => box.id === id ? { ...box, content, metadata: metadata ? { ...box.metadata, ...metadata } : box.metadata } : box) }))
  const updateBoxLayout = (id, changes) => updateDocument((current) => ({ ...current, boxes: current.boxes.map((box) => box.id === id ? { ...box, ...changes } : box) }))
  const changeZoom = (id, direction) => updateDocument((current) => ({ ...current, boxes: current.boxes.map((box) => box.id !== id ? box : { ...box, zoom: zoomLevels[Math.max(0, Math.min(zoomLevels.length - 1, zoomLevels.indexOf(box.zoom) + direction))] }) }))
  const deleteBox = (id) => { updateDocument((current) => ({ ...current, boxes: current.boxes.filter((box) => box.id !== id) })); setSelectedBoxId((current) => current === id ? null : current) }
  const copyBox = (id) => { const copyId = crypto.randomUUID(); updateDocument((current) => { const original = current.boxes.find((box) => box.id === id); return original ? { ...current, boxes: [...current.boxes, { ...original, id: copyId, x: original.x + 24, y: original.y + 24, metadata: { ...original.metadata } }] } : current }); setSelectedBoxId(copyId) }
  const deleteAllBoxes = () => { updateDocument((current) => ({ ...current, boxes: [] })); setSelectedBoxId(null) }
  const uploadImage = async (id, file) => {
    if (!file.type.startsWith('image/')) throw new Error('Please choose a valid image file.')
    const previousImageId = documentRef.current.boxes.find((box) => box.id === id)?.metadata?.imageId
    const imageId = crypto.randomUUID()
    await mediaStorage.saveImage(imageId, file)
    updateBox(id, '', { imageId, fileName: file.name, fileType: file.type })
    // Cleanup is best-effort: the newly saved image remains usable even if a
    // browser refuses deletion of the superseded blob.
    if (previousImageId) mediaStorage.removeImage(previousImageId).catch(() => {})
  }
  const removeImage = async (id) => { const box = documentRef.current.boxes.find((item) => item.id === id); try { await mediaStorage.removeImage(box?.metadata?.imageId) } catch { setSaveStatus('Unable to save locally') }; updateBox(id, '', { imageId: null, fileName: null, fileType: null }) }
  const flushCurrentDocument = () => !isDirty || saveNow(documentRef.current)

  const createNewDocument = () => {
    clearTimeout(saveTimer.current)
    if (!flushCurrentDocument()) return
    const fresh = documentStorage.create()
    if (!saveNow(fresh)) return
    undoStack.current = []; redoStack.current = []
    documentRef.current = fresh; setPageDocument(fresh); setSelectedBoxId(null); setDirty(false); setDocumentManagerOpen(false)
  }
  const openDocument = (id) => {
    clearTimeout(saveTimer.current)
    if (!flushCurrentDocument()) return
    const next = documentStorage.get(id)
    if (!next) { setSaveStatus('Unable to save locally'); refreshDocuments(); return }
    if (!settingsStorage.setActiveDocumentId(next.id)) { setSaveStatus('Unable to save locally'); return }
    undoStack.current = []; redoStack.current = []
    documentRef.current = next; setPageDocument(next); setTheme(next.theme); setSelectedBoxId(null); setDirty(false); setSaveStatus('Saved locally'); setDocumentManagerOpen(false)
  }
  const renameDocument = (id, title) => {
    const target = id === documentRef.current.id ? documentRef.current : documentStorage.get(id)
    if (!target) return
    try {
      const renamed = documentStorage.save(touch({ ...target, title: title.trim() || 'Untitled' }))
      if (id === documentRef.current.id) { documentRef.current = renamed; setPageDocument(renamed); setDirty(false) }
      refreshDocuments()
    } catch { setSaveStatus('Unable to save locally') }
  }
  const deleteDocument = async (id) => {
    if (id === documentRef.current.id && !flushCurrentDocument()) return
    const target = id === documentRef.current.id ? documentRef.current : documentStorage.get(id)
    try {
      // Persist a replacement before deleting the active record, so a quota or
      // settings failure can never strand the user in a document that is gone.
      let fresh = null
      if (id === documentRef.current.id) {
        fresh = documentStorage.create()
        if (!saveNow(fresh)) return
      }
      if (fresh) {
        undoStack.current = []; redoStack.current = []
        documentRef.current = fresh; setPageDocument(fresh); setTheme(fresh.theme); setSelectedBoxId(null); setDirty(false)
      }
      documentStorage.remove(id)
      // The document operation is already complete; old media cleanup should
      // never prevent the new active document from rendering.
      mediaStorage.removeDocumentImages(target || { boxes: [] }).catch(() => {})
      refreshDocuments()
    } catch { setSaveStatus('Unable to save locally') }
  }
  const toggleTheme = () => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); updateDocument((current) => ({ ...current, theme: next })) }
  const exportDocument = async (format) => {
    const labels = { pdf: 'PDF', pptx: 'PPTX', docx: 'DOCX' }
    setExportStatus(`Preparing ${labels[format]}...`)
    try {
      if (format === 'pdf') await exportPdf(documentRef.current)
      else if (format === 'pptx') await exportPptx(documentRef.current)
      else await exportDocx(documentRef.current)
      setExportStatus(`${labels[format]} downloaded`)
    } catch {
      setExportStatus(`Unable to export ${labels[format]}`)
    }
  }
  const undo = () => {
    const previous = undoStack.current.pop()
    if (!previous) return
    redoStack.current = [...redoStack.current.slice(-49), documentRef.current]
    const next = touch(previous); documentRef.current = next; setPageDocument(next); setDirty(true)
  }
  const redo = () => {
    const nextDocument = redoStack.current.pop()
    if (!nextDocument) return
    undoStack.current = [...undoStack.current.slice(-49), documentRef.current]
    const next = touch(nextDocument); documentRef.current = next; setPageDocument(next); setDirty(true)
  }

  useEffect(() => {
    const isEditable = (target) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); clearTimeout(saveTimer.current); saveNow(documentRef.current); return }
      if (isEditable(event.target)) return
      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && key === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo() }
      else if ((event.ctrlKey || event.metaKey) && key === 'y') { event.preventDefault(); redo() }
      else if ((event.ctrlKey || event.metaKey) && key === 'd' && selectedBoxId) { event.preventDefault(); copyBox(selectedBoxId) }
      else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedBoxId) { event.preventDefault(); deleteBox(selectedBoxId) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedBoxId, pageDocument])

  return <div className="app-shell"><Header theme={theme} saveStatus={saveStatus} exportStatus={exportStatus} onThemeToggle={toggleTheme} onAddBox={addBox} onNewDocument={createNewDocument} onOpenDocuments={() => setDocumentManagerOpen(true)} onExport={exportDocument} /><main className="app-main" aria-label="Document workspace"><Workspace document={pageDocument} selectedBoxId={selectedBoxId} onAddBox={addBox} onSelectBox={setSelectedBoxId} onUpdateBox={updateBox} onUpdateLayout={updateBoxLayout} onChangeZoom={changeZoom} onCopyBox={copyBox} onDeleteBox={deleteBox} onDeleteAll={deleteAllBoxes} onUploadImage={uploadImage} onRemoveImage={removeImage} /></main><Footer />{isDocumentManagerOpen && <DocumentManager documents={documents} activeDocumentId={pageDocument.id} onClose={() => setDocumentManagerOpen(false)} onNew={createNewDocument} onOpen={openDocument} onRename={renameDocument} onDelete={deleteDocument} />}</div>
}

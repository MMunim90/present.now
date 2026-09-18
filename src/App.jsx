import { useEffect, useRef, useState } from 'react'
import Header from './components/layout/Header'
import Workspace from './components/workspace/Workspace'
import Footer from './components/layout/Footer'
import DocumentManager from './components/documents/DocumentManager'
import { createBox } from './lib/document'
import { documentStorage } from './services/storage/documentStorage'
import { settingsStorage } from './services/storage/settingsStorage'
import { mediaStorage } from './services/storage/mediaStorage'

const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const touch = (pageDocument) => ({ ...pageDocument, updatedAt: new Date().toISOString() })
function getInitialDocument() { const active = settingsStorage.getActiveDocumentId() && documentStorage.get(settingsStorage.getActiveDocumentId()); return active || documentStorage.migrateLegacy() || documentStorage.create() }

export default function App() {
  const [theme, setTheme] = useState(() => settingsStorage.getTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [pageDocument, setPageDocument] = useState(getInitialDocument)
  const [selectedBoxId, setSelectedBoxId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('Saved locally')
  const [documents, setDocuments] = useState(() => documentStorage.list())
  const [isDocumentManagerOpen, setDocumentManagerOpen] = useState(false)
  const saveTimer = useRef(null)
  const refreshDocuments = () => setDocuments(documentStorage.list())
  const saveNow = (value = pageDocument) => { try { documentStorage.save(value); settingsStorage.setActiveDocumentId(value.id); setSaveStatus('Saved locally'); refreshDocuments(); return true } catch { setSaveStatus('Unable to save locally'); return false } }

  useEffect(() => { globalThis.document.documentElement.classList.toggle('dark', theme === 'dark'); globalThis.document.documentElement.style.colorScheme = theme; settingsStorage.setTheme(theme) }, [theme])
  useEffect(() => { setSaveStatus('Saving...'); clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => saveNow(pageDocument), 650); return () => clearTimeout(saveTimer.current) }, [pageDocument])
  useEffect(() => () => clearTimeout(saveTimer.current), [])
  const updateDocument = (updater) => setPageDocument((current) => touch(updater(current)))
  const addBox = (type) => { const box = createBox(type, pageDocument.boxes.length); updateDocument((current) => ({ ...current, boxes: [...current.boxes, box] })); setSelectedBoxId(box.id) }
  const updateBox = (id, content, metadata) => updateDocument((current) => ({ ...current, boxes: current.boxes.map((box) => box.id === id ? { ...box, content, metadata: metadata ? { ...box.metadata, ...metadata } : box.metadata } : box) }))
  const updateBoxLayout = (id, changes) => updateDocument((current) => ({ ...current, boxes: current.boxes.map((box) => box.id === id ? { ...box, ...changes } : box) }))
  const changeZoom = (id, direction) => updateDocument((current) => ({ ...current, boxes: current.boxes.map((box) => box.id !== id ? box : { ...box, zoom: zoomLevels[Math.max(0, Math.min(zoomLevels.length - 1, zoomLevels.indexOf(box.zoom) + direction))] }) }))
  const deleteBox = (id) => { updateDocument((current) => ({ ...current, boxes: current.boxes.filter((box) => box.id !== id) })); setSelectedBoxId((current) => current === id ? null : current) }
  const copyBox = (id) => { const copyId = crypto.randomUUID(); updateDocument((current) => { const original = current.boxes.find((box) => box.id === id); return original ? { ...current, boxes: [...current.boxes, { ...original, id: copyId, x: original.x + 24, y: original.y + 24, metadata: { ...original.metadata } }] } : current }); setSelectedBoxId(copyId) }
  const deleteAllBoxes = () => { updateDocument((current) => ({ ...current, boxes: [] })); setSelectedBoxId(null) }
  const uploadImage = async (id, file) => { if (!file.type.startsWith('image/')) throw new Error('Please choose a valid image file.'); const imageId = crypto.randomUUID(); await mediaStorage.saveImage(imageId, file); updateBox(id, '', { imageId, fileName: file.name, fileType: file.type }) }
  const removeImage = (id) => updateBox(id, '', { imageId: null, fileName: null, fileType: null })
  const createNewDocument = () => { clearTimeout(saveTimer.current); saveNow(pageDocument); const fresh = documentStorage.create(); documentStorage.save(fresh); settingsStorage.setActiveDocumentId(fresh.id); setPageDocument(fresh); setSelectedBoxId(null); setSaveStatus('Saved locally'); refreshDocuments(); setDocumentManagerOpen(false) }
  const openDocument = (id) => { clearTimeout(saveTimer.current); saveNow(pageDocument); const next = documentStorage.get(id); if (!next) { createNewDocument(); return }; settingsStorage.setActiveDocumentId(next.id); setPageDocument(next); setSelectedBoxId(null); setSaveStatus('Saved locally'); setDocumentManagerOpen(false) }
  const renameDocument = (id, title) => { const target = id === pageDocument.id ? { ...pageDocument, title } : documentStorage.get(id); if (!target) return; const renamed = touch({ ...target, title: title.trim() || 'Untitled' }); documentStorage.save(renamed); if (id === pageDocument.id) setPageDocument(renamed); refreshDocuments() }
  const deleteDocument = (id) => { documentStorage.remove(id); if (id === pageDocument.id) { const fresh = documentStorage.create(); documentStorage.save(fresh); settingsStorage.setActiveDocumentId(fresh.id); setPageDocument(fresh); setSelectedBoxId(null) }; refreshDocuments() }
  return <div className="app-shell"><Header theme={theme} saveStatus={saveStatus} onThemeToggle={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} onAddBox={addBox} onNewDocument={createNewDocument} onOpenDocuments={() => setDocumentManagerOpen(true)} /><main className="app-main" aria-label="Document workspace"><Workspace document={pageDocument} selectedBoxId={selectedBoxId} onAddBox={addBox} onSelectBox={setSelectedBoxId} onUpdateBox={updateBox} onUpdateLayout={updateBoxLayout} onChangeZoom={changeZoom} onCopyBox={copyBox} onDeleteBox={deleteBox} onDeleteAll={deleteAllBoxes} onUploadImage={uploadImage} onRemoveImage={removeImage} /></main><Footer />{isDocumentManagerOpen && <DocumentManager documents={documents} activeDocumentId={pageDocument.id} onClose={() => setDocumentManagerOpen(false)} onNew={createNewDocument} onOpen={openDocument} onRename={renameDocument} onDelete={deleteDocument} />}</div>
}

// documentStorage: persists document JSON (boxes, positions, styles, etc.) in localStorage.
// Media bytes are NOT stored here — see mediaStorage.js. Boxes reference media by id.

const INDEX_KEY = 'presentnow:documents:index' // [{ id, name, updatedAt, createdAt }]
const DOC_PREFIX = 'presentnow:document:'
const ACTIVE_DOC_KEY = 'presentnow:activeDocumentId'

function safeParse(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.warn('Corrupted local data, falling back.', err)
    return fallback
  }
}

export function getDocumentIndex() {
  const list = safeParse(localStorage.getItem(INDEX_KEY), [])
  return Array.isArray(list) ? list : []
}

function setDocumentIndex(list) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to persist document index', err)
    throw err
  }
}

export function getDocument(id) {
  const raw = localStorage.getItem(DOC_PREFIX + id)
  return safeParse(raw, null)
}

export function saveDocument(doc) {
  if (!doc || !doc.id) throw new Error('Document must have an id')
  try {
    localStorage.setItem(DOC_PREFIX + doc.id, JSON.stringify(doc))
    const index = getDocumentIndex()
    const existing = index.find((d) => d.id === doc.id)
    const entry = { id: doc.id, name: doc.name, updatedAt: doc.updatedAt, createdAt: doc.createdAt }
    if (existing) {
      Object.assign(existing, entry)
    } else {
      index.unshift(entry)
    }
    setDocumentIndex(index)
    return true
  } catch (err) {
    console.error('Failed to save document (quota or serialization error)', err)
    throw err
  }
}

export function deleteDocument(id) {
  localStorage.removeItem(DOC_PREFIX + id)
  setDocumentIndex(getDocumentIndex().filter((d) => d.id !== id))
}

export function renameDocument(id, name) {
  const doc = getDocument(id)
  if (!doc) return null
  doc.name = name
  doc.updatedAt = new Date().toISOString()
  saveDocument(doc)
  return doc
}

export function getActiveDocumentId() {
  return localStorage.getItem(ACTIVE_DOC_KEY)
}

export function setActiveDocumentId(id) {
  localStorage.setItem(ACTIVE_DOC_KEY, id)
}

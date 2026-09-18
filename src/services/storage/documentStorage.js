const INDEX_KEY = 'present-now:documents'
const LEGACY_KEY = 'present-now-document'
const documentKey = (id) => `present-now:document:${id}`

const createBlankDocument = () => {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), title: 'Untitled', boxes: [], createdAt: now, updatedAt: now }
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) } catch { return fallback }
}

function getIndex() {
  const index = readJson(INDEX_KEY, [])
  return Array.isArray(index) ? index : []
}

function setIndex(index) { localStorage.setItem(INDEX_KEY, JSON.stringify(index)) }

function summary(pageDocument) {
  return { id: pageDocument.id, title: pageDocument.title || 'Untitled', createdAt: pageDocument.createdAt, updatedAt: pageDocument.updatedAt, boxCount: pageDocument.boxes.length }
}

export const documentStorage = {
  create: createBlankDocument,
  list() { return getIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) },
  get(id) {
    const value = readJson(documentKey(id), null)
    if (!value || !value.id || !Array.isArray(value.boxes)) return null
    return value
  },
  save(pageDocument) {
    const next = { ...pageDocument, title: pageDocument.title?.trim() || 'Untitled', updatedAt: new Date().toISOString() }
    if (!next.createdAt) next.createdAt = next.updatedAt
    localStorage.setItem(documentKey(next.id), JSON.stringify(next))
    const index = getIndex().filter((item) => item.id !== next.id)
    setIndex([summary(next), ...index])
    return next
  },
  remove(id) {
    localStorage.removeItem(documentKey(id))
    setIndex(getIndex().filter((item) => item.id !== id))
  },
  migrateLegacy() {
    const legacy = readJson(LEGACY_KEY, null)
    if (!legacy || !legacy.id || !Array.isArray(legacy.boxes)) return null
    const migrated = { ...legacy, title: legacy.title || 'Untitled', createdAt: legacy.createdAt || new Date().toISOString(), updatedAt: legacy.updatedAt || new Date().toISOString() }
    try { this.save(migrated); localStorage.removeItem(LEGACY_KEY); return migrated } catch { return null }
  },
}

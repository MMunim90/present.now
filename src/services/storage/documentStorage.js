const INDEX_KEY = 'present-now:documents'
const LEGACY_KEY = 'present-now-document'
const documentKey = (id) => `present-now:document:${id}`

const now = () => new Date().toISOString()
const createBlankDocument = () => {
  const timestamp = now()
  return { id: crypto.randomUUID(), title: 'Untitled', theme: 'light', boxes: [], createdAt: timestamp, updatedAt: timestamp }
}

function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw) } catch { return fallback } }

function getIndex() {
  const index = readJson(INDEX_KEY, [])
  return Array.isArray(index) ? index.filter((item) => item && typeof item.id === 'string') : []
}

function setIndex(index) { localStorage.setItem(INDEX_KEY, JSON.stringify(index)) }

function normalise(value) {
  if (!value || typeof value.id !== 'string' || !Array.isArray(value.boxes)) return null
  const timestamp = now()
  return { ...value, title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : 'Untitled', theme: value.theme === 'dark' ? 'dark' : 'light', createdAt: typeof value.createdAt === 'string' ? value.createdAt : timestamp, updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : timestamp }
}

function summary(pageDocument) { return { id: pageDocument.id, title: pageDocument.title, createdAt: pageDocument.createdAt, updatedAt: pageDocument.updatedAt, boxCount: pageDocument.boxes.length } }

export const documentStorage = {
  create: createBlankDocument,
  list() { return getIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) },
  get(id) {
    const value = normalise(readJson(documentKey(id), null))
    if (value) return value
    try { setIndex(getIndex().filter((item) => item.id !== id)) } catch { /* storage may be unavailable */ }
    return null
  },
  save(pageDocument) {
    const next = normalise({ ...pageDocument, updatedAt: now() })
    if (!next) throw new Error('Invalid document data')
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
    const migrated = normalise(readJson(LEGACY_KEY, null))
    if (!migrated) return null
    try { this.save(migrated); localStorage.removeItem(LEGACY_KEY); return migrated } catch { return null }
  },
}

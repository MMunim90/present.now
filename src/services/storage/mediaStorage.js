// mediaStorage: stores large binary blobs (images, local videos) in IndexedDB.
// Boxes only ever hold a mediaId reference in localStorage-persisted document state;
// the actual bytes live here so we don't blow past localStorage quotas.

const DB_NAME = 'present-now-media'
const DB_VERSION = 1
const STORE_NAME = 'media'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function saveMedia(id, blob, mimeType) {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ id, blob, mimeType, createdAt: Date.now() })
      tx.oncomplete = () => resolve(id)
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('saveMedia failed', err)
    throw err
  }
}

export async function getMedia(id) {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('getMedia failed', err)
    return null
  }
}

export async function deleteMedia(id) {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('deleteMedia failed', err)
    return false
  }
}

export async function getMediaObjectUrl(id) {
  const record = await getMedia(id)
  if (!record || !record.blob) return null
  return URL.createObjectURL(record.blob)
}

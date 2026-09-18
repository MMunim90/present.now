const DATABASE_NAME = 'present-now'
const IMAGE_STORE = 'images'
const DOCUMENT_KEY = 'present-now-document'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(IMAGE_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveImageBlob(id, file) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE, 'readwrite')
    transaction.objectStore(IMAGE_STORE).put(file, id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadImageBlob(id) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).get(id)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

export function loadSavedDocument() {
  try { return JSON.parse(localStorage.getItem(DOCUMENT_KEY) || 'null') } catch { return null }
}

export function saveDocument(pageDocument) {
  localStorage.setItem(DOCUMENT_KEY, JSON.stringify(pageDocument))
}

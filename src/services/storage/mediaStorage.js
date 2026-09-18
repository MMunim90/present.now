const DATABASE_NAME = 'present-now'
const IMAGE_STORE = 'images'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(IMAGE_STORE)) request.result.createObjectStore(IMAGE_STORE) }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const mediaStorage = {
  async saveImage(id, file) {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(IMAGE_STORE, 'readwrite')
      transaction.objectStore(IMAGE_STORE).put(file, id)
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
    })
  },
  async getImage(id) {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const request = database.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).get(id)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  },
}

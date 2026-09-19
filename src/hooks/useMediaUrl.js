import { useEffect, useState } from 'react'
import { getMediaObjectUrl } from '../services/storage/mediaStorage'

export function useMediaUrl(mediaId) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl = null
    setError(null)

    if (!mediaId) {
      setUrl(null)
      return
    }

    getMediaObjectUrl(mediaId)
      .then((u) => {
        if (cancelled) return
        objectUrl = u
        setUrl(u)
        if (!u) setError('Media not found in local storage.')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load media')
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mediaId])

  return { url, error }
}

import React, { useRef, useState } from 'react'
import { ImagePlus, RefreshCw, XCircle, ImageOff } from 'lucide-react'
import BaseBox from './BaseBox'
import IconButton from '../ui/IconButton'
import { useDocumentStore } from '../../store/DocumentContext'
import { useMediaUrl } from '../../hooks/useMediaUrl'
import { saveMedia, deleteMedia } from '../../services/storage/mediaStorage'
import { uuid } from '../../utils/ids'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB safety cap

export default function ImageBox({ box, pageRef }) {
  const { updateBox } = useDocumentStore()
  const fileInputRef = useRef(null)
  const [uploadError, setUploadError] = useState(null)
  const { url, error: loadError } = useMediaUrl(box.content?.mediaId)

  const handleFile = async (file) => {
    setUploadError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image is too large (max 15MB).')
      return
    }
    try {
      const previousMediaId = box.content?.mediaId
      const mediaId = uuid()
      await saveMedia(mediaId, file, file.type)
      updateBox(box.id, { content: { mediaId, name: file.name } })
      if (previousMediaId) await deleteMedia(previousMediaId)
    } catch (err) {
      console.error(err)
      setUploadError('Failed to store image locally. Storage may be full.')
    }
  }

  const handleRemove = async () => {
    const mediaId = box.content?.mediaId
    updateBox(box.id, { content: { mediaId: null, name: null } })
    if (mediaId) {
      try {
        await deleteMedia(mediaId)
      } catch (err) {
        console.warn(err)
      }
    }
  }

  return (
    <BaseBox
      box={box}
      pageRef={pageRef}
      extraControls={
        <>
          <IconButton icon={ImagePlus} label={url ? 'Replace image' : 'Upload image'} size="sm" onClick={() => fileInputRef.current?.click()} />
          {url && <IconButton icon={XCircle} label="Remove image" size="sm" onClick={handleRemove} />}
        </>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="Upload image"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {url ? (
        <img
          src={url}
          alt={box.content?.name || 'Uploaded content'}
          className="h-full w-full object-cover"
          style={{ objectFit: box.style?.objectFit || 'cover' }}
        />
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 dark:bg-gray-900/40 dark:hover:bg-gray-900/70"
        >
          {loadError ? <ImageOff size={28} /> : <ImagePlus size={28} />}
          <span className="text-xs font-medium">{loadError ? 'Image unavailable' : 'Click to upload an image'}</span>
        </button>
      )}
      {uploadError && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 dark:bg-red-900/50 dark:text-red-300">
          {uploadError}
        </div>
      )}
    </BaseBox>
  )
}

import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import BaseBox from './BaseBox'
import { mediaStorage } from '../../services/storage/mediaStorage'

export default function ImageBox({ box, ...props }) {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let objectUrl; let cancelled = false
    setError('')
    if (!box.metadata.imageId) { setPreview(null); return undefined }
    mediaStorage.getImage(box.metadata.imageId).then((blob) => {
      if (cancelled) return
      if (blob) { objectUrl = URL.createObjectURL(blob); setPreview(objectUrl) } else { setPreview(null); setError('Image file is unavailable.') }
    }).catch(() => { if (!cancelled) { setPreview(null); setError('Could not load this image.') } })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [box.metadata.imageId])
  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose a valid image file.'); return }
    try { setError(''); await props.onUpload(file) } catch { setError('Could not save this image locally.') } finally { event.target.value = '' }
  }
  return <BaseBox box={box} {...props}>{preview ? <div className="image-frame"><img className="uploaded-image" src={preview} alt={box.metadata.fileName || 'Uploaded'} /><div className="image-actions"><label title="Replace image"><RefreshCw size={14} /><span>Replace</span><input type="file" accept="image/*" onChange={handleUpload} /></label><button type="button" onClick={props.onRemove} title="Remove image" aria-label="Remove image"><Trash2 size={14} /></button></div></div> : <label className="media-placeholder"><ImagePlus size={26} /><strong>Upload an image</strong><span>{error || 'PNG, JPG, GIF, or WebP'}</span><input type="file" accept="image/*" onChange={handleUpload} /></label>}</BaseBox>
}

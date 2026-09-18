import { useEffect, useState } from 'react'
import { ImagePlus, Minimize2, PlaySquare, X } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import CodeEditor from './CodeEditor'
import { mediaStorage } from '../../services/storage/mediaStorage'

export default function ExpandedBox({ box, onChange, onClose }) {
  const [imageUrl, setImageUrl] = useState(null)
  useEffect(() => {
    let objectUrl
    if (box.type !== 'image' || !box.metadata.imageId) return undefined
    mediaStorage.getImage(box.metadata.imageId).then((blob) => { if (blob) { objectUrl = URL.createObjectURL(blob); setImageUrl(objectUrl) } })
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [box.metadata.imageId, box.type])
  const title = `${box.type.charAt(0).toUpperCase()}${box.type.slice(1)} box`
  const body = {
    text: <RichTextEditor expanded value={box.content} onChange={onChange} />,
    output: <textarea autoFocus className="expanded-textarea output-content" value={box.content} onChange={(event) => onChange(event.target.value)} placeholder="Output will appear here…" />,
    code: <CodeEditor expanded value={box.content} language={box.metadata.language || 'JavaScript'} onChange={onChange} onLanguageChange={(language) => onChange(box.content, { language })} />,
    image: imageUrl ? <img className="expanded-image" src={imageUrl} alt={box.metadata.fileName || 'Uploaded'} /> : <div className="expanded-media"><ImagePlus size={32} /><strong>Upload an image from the box view</strong></div>,
    video: <div className="expanded-media"><PlaySquare size={34} /><strong>{box.content ? 'Video preview is available in the box' : 'Video placeholder'}</strong><span>Use the box URL field to replace the source.</span></div>,
  }[box.type]
  return <div className="expanded-backdrop" role="presentation" onPointerDown={onClose}><section className="expanded-dialog" role="dialog" aria-modal="true" aria-label={`Expanded ${title}`} onPointerDown={(event) => event.stopPropagation()}><header><div><span>Focused editor</span><h2>{title}</h2></div><button type="button" className="expanded-close" onClick={onClose} title="Minimize box" aria-label="Minimize box"><Minimize2 size={18} /><span>Minimize</span></button></header><div className="expanded-body">{body}</div><button className="expanded-x" type="button" onClick={onClose} aria-label="Close expanded editor" title="Close"><X size={18} /></button></section></div>
}

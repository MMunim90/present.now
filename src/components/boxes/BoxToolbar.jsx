import { Copy, Expand, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import IconButton from '../ui/IconButton'

export default function BoxToolbar({ zoom, onExpand, onZoomIn, onZoomOut, onCopy, onDelete }) {
  return <div className="box-toolbar" aria-label="Box actions" onPointerDown={(event) => event.stopPropagation()}>
    <IconButton label="Expand box" onClick={onExpand}><Expand size={14} /></IconButton>
    <IconButton label={`Zoom in (currently ${zoom}%)`} onClick={onZoomIn}><ZoomIn size={14} /></IconButton>
    <IconButton label={`Zoom out (currently ${zoom}%)`} onClick={onZoomOut}><ZoomOut size={14} /></IconButton>
    <span className="box-zoom" aria-label={`Zoom: ${zoom}%`}>{zoom}%</span>
    <IconButton label="Copy box" onClick={onCopy}><Copy size={14} /></IconButton>
    <IconButton label="Delete box" onClick={onDelete}><Trash2 size={14} /></IconButton>
  </div>
}

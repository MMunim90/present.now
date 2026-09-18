import { useEffect, useState } from 'react'
import { Braces, FileText, GripHorizontal, Image, MonitorPlay, TerminalSquare } from 'lucide-react'
import BoxToolbar from './BoxToolbar'

const boxDetails = {
  text: { label: 'Text', icon: FileText }, image: { label: 'Image', icon: Image },
  video: { label: 'Video', icon: MonitorPlay }, code: { label: 'Code', icon: Braces },
  output: { label: 'Output', icon: TerminalSquare },
}

const minSize = { text: [220, 130], image: [240, 170], video: [250, 170], code: [280, 180], output: [240, 150] }

export default function BaseBox({ box, selected, onSelect, onCopy, onDelete, onExpand, onZoomIn, onZoomOut, onUpdateLayout, children }) {
  const { label, icon: Icon } = boxDetails[box.type]
  const [interaction, setInteraction] = useState(null)
  useEffect(() => {
    if (!interaction) return undefined
    const move = (event) => {
      const dx = event.clientX - interaction.startX
      const dy = event.clientY - interaction.startY
      if (interaction.kind === 'drag') onUpdateLayout({ x: Math.max(0, interaction.x + dx), y: Math.max(0, interaction.y + dy) })
      else {
        const [minWidth, minHeight] = minSize[box.type]
        onUpdateLayout({ width: Math.max(minWidth, interaction.width + dx / interaction.zoom), height: Math.max(minHeight, interaction.height + dy / interaction.zoom) })
      }
    }
    const end = () => setInteraction(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end) }
  }, [interaction, box.type, onUpdateLayout])
  const begin = (kind) => (event) => {
    event.preventDefault(); event.stopPropagation(); onSelect(event)
    setInteraction({ kind, startX: event.clientX, startY: event.clientY, x: box.x, y: box.y, width: box.width, height: box.height, zoom: box.zoom })
  }
  return <article
    className={`content-box ${selected ? 'is-selected' : ''} ${interaction ? 'is-interacting' : ''}`}
    style={{ left: box.x, top: box.y, width: box.width * box.zoom, height: box.height * box.zoom, zIndex: selected ? 1 : 0 }}
    onPointerDownCapture={onSelect}
    onPointerDown={(event) => event.stopPropagation()}
    onFocus={onSelect}
    tabIndex={0}
    aria-label={`${label} box`}
  >
    <header className="box-header"><button className="box-drag-handle" type="button" onPointerDown={begin('drag')} title="Drag to move box" aria-label="Drag to move box"><GripHorizontal size={15} /></button><span className="box-title"><Icon size={14} /><span>{label}</span></span>{selected && <BoxToolbar zoom={box.zoom * 100} onExpand={onExpand} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onCopy={onCopy} onDelete={onDelete} />}</header>
    <div className="box-content">{children}</div>
    {selected && <button className="box-resize-handle" type="button" onPointerDown={begin('resize')} title="Drag to resize box" aria-label="Drag to resize box" />}
  </article>
}

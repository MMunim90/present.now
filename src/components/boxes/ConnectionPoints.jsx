import React, { useCallback, useRef } from 'react'
import { useDocumentStore } from '../../store/DocumentContext'

// Each point's CSS position is expressed as a percentage offset from the
// box's own top-left corner, so it always sits exactly centered on that
// edge of the border regardless of box size — never floating away from it.
const POINT_POSITIONS = {
  top: { left: '50%', top: 0 },
  right: { left: '100%', top: '50%' },
  bottom: { left: '50%', top: '100%' },
  left: { left: 0, top: '50%' },
}

export default function ConnectionPoints({ box, pageRef, forceVisible }) {
  const { pendingConnection, setPendingConnection, addConnection } = useDocumentStore()
  const draggingRef = useRef(false)

  const toCanvasCoords = useCallback(
    (clientX, clientY) => {
      const rect = pageRef?.current?.getBoundingClientRect()
      if (!rect) return { x: clientX, y: clientY }
      return { x: clientX - rect.left, y: clientY - rect.top }
    },
    [pageRef]
  )

  const handlePointerDown = (point) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    draggingRef.current = true
    const pos = toCanvasCoords(e.clientX, e.clientY)
    setPendingConnection({ sourceBoxId: box.id, sourcePoint: point, x: pos.x, y: pos.y })

    const onMove = (ev) => {
      if (!draggingRef.current) return
      const p = toCanvasCoords(ev.clientX, ev.clientY)
      setPendingConnection((prev) => (prev ? { ...prev, x: p.x, y: p.y } : prev))
    }

    const onUp = (ev) => {
      draggingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      const dropEl = document.elementFromPoint(ev.clientX, ev.clientY)
      const targetEl = dropEl?.closest?.('[data-connection-box-id]')
      if (targetEl) {
        const targetBoxId = targetEl.getAttribute('data-connection-box-id')
        const targetPoint = targetEl.getAttribute('data-connection-point')
        if (targetBoxId && targetBoxId !== box.id) {
          addConnection(box.id, point, targetBoxId, targetPoint)
        }
        // Same-box or otherwise invalid drops simply cancel — no connection created.
      }
      setPendingConnection(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const isDragSource = pendingConnection?.sourceBoxId === box.id
  const dragActive = !!pendingConnection
  const visible = forceVisible || dragActive

  return (
    <>
      {Object.keys(POINT_POSITIONS).map((point) => {
        const pos = POINT_POSITIONS[point]
        const isActiveSource = isDragSource && pendingConnection.sourcePoint === point
        return (
          <button
            key={point}
            type="button"
            aria-label={`${point} connection point`}
            title="Drag to connect to another box"
            data-connection-box-id={box.id}
            data-connection-point={point}
            onPointerDown={handlePointerDown(point)}
            className={`absolute z-40 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent-500 shadow-soft transition-all hover:scale-125 dark:border-gray-900 ${
              visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } ${isActiveSource ? 'scale-125 ring-2 ring-accent-300' : ''}`}
            style={{ left: pos.left, top: pos.top, cursor: 'crosshair' }}
          />
        )
      })}
    </>
  )
}

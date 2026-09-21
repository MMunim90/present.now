import React, { useCallback, useRef } from 'react'
import { useDocumentStore } from '../../store/DocumentContext'
import BoxToolbar from './BoxToolbar'
import ConnectionPoints from './ConnectionPoints'
import { clamp, nextZoom } from '../../utils/formatting'

const MIN_WIDTH = 180
const MIN_HEIGHT = 120

export default function BaseBox({ box, pageWidth, pageRef, extraControls, secondaryToolbar, children, contentClassName = '' }) {
  const {
    selectedId,
    setSelectedId,
    expandedId,
    setExpandedId,
    setSelectedConnectionId,
    updateBox,
    deleteBox,
    copyBox,
    bringToFront,
    beginTransientEdit,
    endTransientEdit,
  } = useDocumentStore()

  const selected = selectedId === box.id
  const expanded = expandedId === box.id
  const dragInfo = useRef(null)
  const resizeInfo = useRef(null)

  const select = useCallback(
    (e) => {
      e.stopPropagation()
      setSelectedId(box.id)
      setSelectedConnectionId(null)
      bringToFront(box.id)
    },
    [box.id, setSelectedId, setSelectedConnectionId, bringToFront]
  )

  // ---------- Drag ----------
  const onDragPointerDown = useCallback(
    (e) => {
      if (expanded || box.locked) return
      e.preventDefault()
      select(e)
      beginTransientEdit()
      dragInfo.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: box.x,
        origY: box.y,
      }
      window.addEventListener('pointermove', onDragMove)
      window.addEventListener('pointerup', onDragUp)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [box.x, box.y, box.locked, expanded]
  )

  const onDragMove = useCallback(
    (e) => {
      const info = dragInfo.current
      if (!info) return
      const dx = e.clientX - info.startX
      const dy = e.clientY - info.startY
      const pageBounds = pageRef?.current?.getBoundingClientRect()
      const maxX = pageBounds ? pageBounds.width - 60 : 4000
      updateBox(
        box.id,
        {
          x: clamp(info.origX + dx, 0, maxX),
          y: Math.max(0, info.origY + dy),
        },
        { record: false }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [box.id]
  )

  const onDragUp = useCallback(() => {
    dragInfo.current = null
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragUp)
    endTransientEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Resize ----------
  const onResizePointerDown = useCallback(
    (e) => {
      if (box.locked) return
      e.preventDefault()
      e.stopPropagation()
      select(e)
      beginTransientEdit()
      resizeInfo.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: box.width,
        origH: box.height,
      }
      window.addEventListener('pointermove', onResizeMove)
      window.addEventListener('pointerup', onResizeUp)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [box.width, box.height, box.locked]
  )

  const onResizeMove = useCallback(
    (e) => {
      const info = resizeInfo.current
      if (!info) return
      const dx = e.clientX - info.startX
      const dy = e.clientY - info.startY
      updateBox(
        box.id,
        {
          width: clamp(info.origW + dx, MIN_WIDTH, 2000),
          height: clamp(info.origH + dy, MIN_HEIGHT, 2000),
        },
        { record: false }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [box.id]
  )

  const onResizeUp = useCallback(() => {
    resizeInfo.current = null
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', onResizeUp)
    endTransientEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleZoomIn = () => updateBox(box.id, { zoom: nextZoom(box.zoom, 1) })
  const handleZoomOut = () => updateBox(box.id, { zoom: nextZoom(box.zoom, -1) })
  const handleExpandToggle = () => setExpandedId(expanded ? null : box.id)
  const handleToggleLock = (e) => {
    e.stopPropagation()
    updateBox(box.id, { locked: !box.locked })
  }
  const handleCopy = (e) => {
    e.stopPropagation()
    copyBox(box.id)
  }
  const handleDelete = (e) => {
    e.stopPropagation()
    deleteBox(box.id)
  }

  const frameStyle = expanded
    ? {}
    : {
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        zIndex: selected ? 30 : 1,
      }

  return (
    <div
      className={
        expanded
          ? 'fixed inset-0 z-[90] flex items-center justify-center bg-gray-900/50 p-4 animate-fade-in backdrop-blur-[2px] sm:p-8'
          : 'group'
      }
      style={expanded ? {} : frameStyle}
      onMouseDown={expanded ? undefined : select}
    >
      <div
        className={
          expanded
            ? 'flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-pop animate-scale-in dark:border-gray-700 dark:bg-gray-800'
            : `flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white shadow-soft transition-shadow dark:bg-gray-800 ${
                selected
                  ? 'border-accent-400 ring-2 ring-accent-100 dark:ring-accent-900/40'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
              } ${box.locked ? 'border-dashed' : ''}`
        }
        onMouseDown={expanded ? select : undefined}
      >
        {(selected || expanded) && (
          <BoxToolbar
            label={box.label}
            zoom={box.zoom}
            expanded={expanded}
            locked={!!box.locked}
            onToggleLock={handleToggleLock}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onExpandToggle={handleExpandToggle}
            onCopy={handleCopy}
            onDelete={handleDelete}
            dragHandleProps={expanded || box.locked ? {} : { onPointerDown: onDragPointerDown }}
            extraControls={extraControls}
          />
        )}
        {(selected || expanded) && secondaryToolbar}
        <div
          className={`relative min-h-0 flex-1 overflow-auto ${contentClassName}`}
          style={
            expanded
              ? {}
              : {
                  borderTopLeftRadius: selected ? 0 : undefined,
                }
          }
        >
          <div
            style={{
              transform: expanded ? 'none' : `scale(${box.zoom / 100})`,
              transformOrigin: 'top left',
              width: expanded ? '100%' : `${10000 / box.zoom}%`,
              minHeight: '100%',
            }}
          >
            {children}
          </div>
        </div>

        {!expanded && selected && !box.locked && (
          <div
            onPointerDown={onResizePointerDown}
            className="absolute bottom-0 right-0 z-40 h-4 w-4 cursor-nwse-resize rounded-tl border-l border-t border-gray-300 bg-white/80 dark:border-gray-500 dark:bg-gray-700/80"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 3px)',
              color: '#9ca3af',
            }}
            aria-hidden="true"
            title="Resize"
          />
        )}
      </div>

      {!expanded && <ConnectionPoints box={box} pageRef={pageRef} forceVisible={selected} />}
    </div>
  )
}

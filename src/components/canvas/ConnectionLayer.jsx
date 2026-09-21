import React, { useMemo } from 'react'
import { useDocumentStore } from '../../store/DocumentContext'
import { getConnectionPointCoords } from '../../utils/connections'

export default function ConnectionLayer({ width, height }) {
  const { doc, selectedConnectionId, selectConnection, pendingConnection } = useDocumentStore()

  const boxesById = useMemo(() => {
    const map = new Map()
    doc.boxes.forEach((b) => map.set(b.id, b))
    return map
  }, [doc.boxes])

  const pendingSourceBox = pendingConnection ? boxesById.get(pendingConnection.sourceBoxId) : null

  return (
    <svg
      className="absolute inset-0 overflow-visible"
      width={width}
      height={height}
      style={{ zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <marker id="pn-connection-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" className="fill-gray-400 dark:fill-gray-500" />
        </marker>
        <marker
          id="pn-connection-arrow-selected"
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" className="fill-accent-500" />
        </marker>
      </defs>

      {doc.connections.map((conn) => {
        const source = boxesById.get(conn.sourceBoxId)
        const target = boxesById.get(conn.targetBoxId)
        if (!source || !target) return null
        const p1 = getConnectionPointCoords(source, conn.sourcePoint)
        const p2 = getConnectionPointCoords(target, conn.targetPoint)
        const isSelected = selectedConnectionId === conn.id

        return (
          <g key={conn.id}>
            {/* Wide invisible line purely as a comfortable click target for selection. */}
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="transparent"
              strokeWidth={14}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseDown={(e) => {
                e.stopPropagation()
                selectConnection(conn.id)
              }}
            />
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className={isSelected ? 'stroke-accent-500' : 'stroke-gray-300 dark:stroke-gray-600'}
              strokeWidth={isSelected ? 2 : 1.5}
              markerEnd={`url(#${isSelected ? 'pn-connection-arrow-selected' : 'pn-connection-arrow'})`}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        )
      })}

      {pendingConnection && pendingSourceBox && (
        <line
          x1={getConnectionPointCoords(pendingSourceBox, pendingConnection.sourcePoint).x}
          y1={getConnectionPointCoords(pendingSourceBox, pendingConnection.sourcePoint).y}
          x2={pendingConnection.x}
          y2={pendingConnection.y}
          className="stroke-accent-400"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  )
}

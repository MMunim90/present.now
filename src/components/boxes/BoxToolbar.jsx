import React from 'react'
import { Maximize2, Minimize2, Copy, Trash2, ZoomIn, ZoomOut, GripVertical, Lock, Unlock } from 'lucide-react'
import IconButton from '../ui/IconButton'
import { ZOOM_LEVELS } from '../../utils/formatting'

export default function BoxToolbar({
  label,
  zoom,
  expanded,
  locked,
  onToggleLock,
  onZoomIn,
  onZoomOut,
  onExpandToggle,
  onCopy,
  onDelete,
  dragHandleProps,
  extraControls,
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-t-xl border border-b-0 border-gray-200 bg-gray-50/95 px-1.5 py-1 text-gray-500 backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/95"
      {...dragHandleProps}
    >
      <span
        className={`flex items-center gap-1 pr-1 text-gray-400 ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
        title={locked ? 'Locked — unlock to move' : 'Drag to move'}
      >
        <GripVertical size={14} />
        <span className="select-none text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </span>

      <div className="ml-auto flex items-center gap-0.5">
        {extraControls}

        <div className="mx-0.5 flex items-center gap-0.5 rounded-md bg-white px-0.5 dark:bg-gray-900/60">
          <IconButton icon={ZoomOut} label="Zoom out" size="sm" onClick={onZoomOut} disabled={zoom <= ZOOM_LEVELS[0]} />
          <span className="w-9 select-none text-center text-[11px] font-medium tabular-nums text-gray-500 dark:text-gray-400">
            {zoom}%
          </span>
          <IconButton icon={ZoomIn} label="Zoom in" size="sm" onClick={onZoomIn} disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]} />
        </div>

        <IconButton
          icon={locked ? Lock : Unlock}
          label={locked ? 'Unlock box (allow move & resize)' : 'Lock box (prevent move & resize)'}
          size="sm"
          active={locked}
          onClick={onToggleLock}
        />
        <IconButton icon={expanded ? Minimize2 : Maximize2} label={expanded ? 'Minimize' : 'Expand'} size="sm" onClick={onExpandToggle} />
        <IconButton icon={Copy} label="Duplicate box" size="sm" onClick={onCopy} />
        <IconButton
          icon={Trash2}
          label="Delete box"
          size="sm"
          onClick={onDelete}
          className="hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-900/30 dark:hover:!text-red-400"
        />
      </div>
    </div>
  )
}

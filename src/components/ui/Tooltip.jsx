import React, { useState } from 'react'

export default function Tooltip({ label, children, side = 'bottom' }) {
  const [show, setShow] = useState(false)

  const positionClasses = {
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && label && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-pop animate-fade-in dark:bg-gray-700 ${positionClasses[side]}`}
        >
          {label}
        </span>
      )}
    </span>
  )
}

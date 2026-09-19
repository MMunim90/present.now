import React, { useEffect, useRef, useState } from 'react'

export default function Dropdown({ trigger, children, align = 'left', width = 'w-56' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {trigger(() => setOpen((o) => !o), open)}
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1.5 ${width} ${align === 'right' ? 'right-0' : 'left-0'} animate-scale-in rounded-xl border border-gray-200 bg-white p-1.5 shadow-pop dark:border-gray-700 dark:bg-gray-800`}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

/**
 * Tracks the *content-box* width/height of the returned ref's element.
 * ResizeObserver's default observed box is content-box, so this already
 * excludes the element's own padding/border — exactly the space available
 * to children laid out inside it.
 */
export function useElementSize(initial = { width: 0, height: 0 }) {
  const ref = useRef(null)
  const [size, setSize] = useState(initial)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })

    observer.observe(el)
    // Capture the initial size immediately (ResizeObserver only fires on change).
    const rect = el.getBoundingClientRect()
    const styles = getComputedStyle(el)
    const paddingX = parseFloat(styles.paddingLeft || 0) + parseFloat(styles.paddingRight || 0)
    const paddingY = parseFloat(styles.paddingTop || 0) + parseFloat(styles.paddingBottom || 0)
    setSize({ width: rect.width - paddingX, height: rect.height - paddingY })

    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

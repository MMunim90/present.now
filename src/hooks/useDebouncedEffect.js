import { useEffect, useRef } from 'react'

export function useDebouncedEffect(effect, deps, delay) {
  const handle = useRef(null)
  useEffect(() => {
    handle.current = setTimeout(() => {
      effect()
    }, delay)
    return () => clearTimeout(handle.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

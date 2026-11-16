import { useEffect, useState } from 'react'

/**
 * Tracks whether the app is currently in dark mode by observing the `dark`
 * class that the existing theme system toggles on <html>. Read-only: it does
 * not own or change the theme, it just lets charts re-colour themselves.
 */
export function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

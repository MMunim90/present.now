import { useCallback, useEffect, useState } from 'react'
import { getTheme, setTheme as persistTheme } from '../services/storage/settingsStorage'

export function useTheme() {
  const [theme, setThemeState] = useState(() => getTheme())

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    persistTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, setTheme: setThemeState, toggleTheme }
}

const SETTINGS_KEY = 'presentnow:settings'

const DEFAULT_SETTINGS = {
  theme: 'light',
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch (err) {
    console.warn('Corrupted settings, resetting to defaults.', err)
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed to persist settings', err)
  }
}

export function getTheme() {
  return getSettings().theme
}

export function setTheme(theme) {
  const settings = getSettings()
  settings.theme = theme
  saveSettings(settings)
}

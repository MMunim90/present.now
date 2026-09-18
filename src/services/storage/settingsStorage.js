const SETTINGS_KEY = 'present-now:settings'

function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
}

function writeSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return true } catch { return false }
}

export const settingsStorage = {
  getTheme: () => readSettings().theme,
  setTheme: (theme) => writeSettings({ ...readSettings(), theme }),
  getActiveDocumentId: () => readSettings().activeDocumentId,
  setActiveDocumentId: (activeDocumentId) => writeSettings({ ...readSettings(), activeDocumentId }),
}

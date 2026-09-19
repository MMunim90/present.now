import { useEffect } from 'react'

function isEditableTarget(target) {
  if (!target) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

/**
 * Wires up application-level keyboard shortcuts. Shortcuts that would clash
 * with native text-editing (Ctrl+C, Delete, Ctrl+D) are suppressed while the
 * focus is inside an editable field, so typing/copy-pasting text is never broken.
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onDeleteSelected,
  onCopySelected,
  onDuplicateSelected,
  onEscape,
  hasSelection,
}) {
  useEffect(() => {
    function handler(e) {
      const editable = isEditableTarget(e.target)
      const mod = e.ctrlKey || e.metaKey

      if (e.key === 'Escape') {
        onEscape?.()
        return
      }

      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave?.()
        return
      }

      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        onUndo?.()
        return
      }

      if ((mod && e.shiftKey && e.key.toLowerCase() === 'z') || (mod && e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        onRedo?.()
        return
      }

      if (editable) return // let native editing / copy / delete behave normally

      if (mod && e.key.toLowerCase() === 'd' && hasSelection) {
        e.preventDefault()
        onDuplicateSelected?.()
        return
      }

      if (mod && e.key.toLowerCase() === 'c' && hasSelection) {
        onCopySelected?.()
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
        e.preventDefault()
        onDeleteSelected?.()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onUndo, onRedo, onSave, onDeleteSelected, onCopySelected, onDuplicateSelected, onEscape, hasSelection])
}

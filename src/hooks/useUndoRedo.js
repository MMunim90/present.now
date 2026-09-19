import { useCallback, useRef, useState } from 'react'

const HISTORY_LIMIT = 60

/**
 * Generic undo/redo wrapper around a piece of state.
 *
 * - `set(updater, { record })` updates the present value. When `record` is
 *   true (default) the previous value is pushed onto the undo stack.
 *   Pass `record: false` for high-frequency updates (e.g. while dragging)
 *   and call `commit(snapshotBeforeChange)` once the interaction ends.
 * - `undo()` / `redo()` move through history.
 */
export function useUndoRedo(initialPresent) {
  const [present, setPresent] = useState(initialPresent)
  const past = useRef([])
  const future = useRef([])
  const [, forceRender] = useState(0)
  const bump = () => forceRender((n) => n + 1)

  const set = useCallback((updater, options = {}) => {
    const { record = true } = options
    setPresent((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (record && next !== prev) {
        past.current = [...past.current, prev].slice(-HISTORY_LIMIT)
        future.current = []
      }
      return next
    })
  }, [])

  // Record a snapshot taken before a batch of non-recorded updates
  // (e.g. the state right before a drag began) without altering `present`.
  const commit = useCallback((snapshotBeforeChange) => {
    past.current = [...past.current, snapshotBeforeChange].slice(-HISTORY_LIMIT)
    future.current = []
    bump()
  }, [])

  const undo = useCallback(() => {
    if (past.current.length === 0) return
    setPresent((prev) => {
      const previous = past.current[past.current.length - 1]
      past.current = past.current.slice(0, -1)
      future.current = [prev, ...future.current].slice(0, HISTORY_LIMIT)
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    setPresent((prev) => {
      const next = future.current[0]
      future.current = future.current.slice(1)
      past.current = [...past.current, prev].slice(-HISTORY_LIMIT)
      return next
    })
  }, [])

  const reset = useCallback((value) => {
    past.current = []
    future.current = []
    setPresent(value)
  }, [])

  return {
    state: present,
    set,
    commit,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}

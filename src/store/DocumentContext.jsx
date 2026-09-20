import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useDebouncedEffect } from '../hooks/useDebouncedEffect'
import { createBox, createEmptyDocument, cloneBoxForCopy } from '../utils/factories'
import { nextLabel } from '../utils/ids'
import * as documentStorage from '../services/storage/documentStorage'
import { deleteMedia } from '../services/storage/mediaStorage'

const DocumentContext = createContext(null)

function loadInitialDocument() {
  try {
    const activeId = documentStorage.getActiveDocumentId()
    if (activeId) {
      const doc = documentStorage.getDocument(activeId)
      if (doc && Array.isArray(doc.boxes)) return doc
    }
    const index = documentStorage.getDocumentIndex()
    if (index.length > 0) {
      const doc = documentStorage.getDocument(index[0].id)
      if (doc && Array.isArray(doc.boxes)) return doc
    }
  } catch (err) {
    console.warn('Failed to load saved document, starting fresh.', err)
  }
  const fresh = createEmptyDocument('Untitled')
  return fresh
}

export function DocumentProvider({ children }) {
  const initialDoc = useMemo(loadInitialDocument, [])
  const { state: doc, set: setDoc, commit, undo, redo, canUndo, canRedo, reset } = useUndoRedo(initialDoc)

  const [selectedId, setSelectedId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const dragSnapshotRef = useRef(null)

  // Persist active document id whenever the document identity changes.
  useEffect(() => {
    documentStorage.setActiveDocumentId(doc.id)
  }, [doc.id])

  // Debounced autosave to localStorage.
  useDebouncedEffect(
    () => {
      setSaveStatus('saving')
      try {
        documentStorage.saveDocument({ ...doc, updatedAt: new Date().toISOString() })
        setSaveStatus('saved')
      } catch (err) {
        console.error(err)
        setSaveStatus('error')
      }
    },
    [doc],
    500
  )

  const updateDoc = useCallback(
    (updater, options) => {
      setDoc((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return { ...next, updatedAt: new Date().toISOString() }
      }, options)
    },
    [setDoc]
  )

  // ---------- Box operations ----------

  const addBox = useCallback(
    (type) => {
      let createdId = null
      updateDoc((prev) => {
        const { label, counters } = nextLabel(prev.counters || {}, type)
        const box = createBox(type, { label })
        createdId = box.id
        return { ...prev, counters, boxes: [...prev.boxes, box] }
      })
      setSelectedId(createdId)
      return createdId
    },
    [updateDoc]
  )

  const updateBox = useCallback(
    (id, patch, options) => {
      updateDoc(
        (prev) => ({
          ...prev,
          boxes: prev.boxes.map((b) => (b.id === id ? { ...b, ...(typeof patch === 'function' ? patch(b) : patch) } : b)),
        }),
        options
      )
    },
    [updateDoc]
  )

  const beginTransientEdit = useCallback(() => {
    dragSnapshotRef.current = doc
  }, [doc])

  const endTransientEdit = useCallback(() => {
    if (dragSnapshotRef.current) {
      commit(dragSnapshotRef.current)
      dragSnapshotRef.current = null
    }
  }, [commit])

  const deleteBox = useCallback(
    async (id) => {
      const box = doc.boxes.find((b) => b.id === id)
      updateDoc((prev) => ({ ...prev, boxes: prev.boxes.filter((b) => b.id !== id) }))
      setSelectedId((cur) => (cur === id ? null : cur))
      setExpandedId((cur) => (cur === id ? null : cur))
      // Best-effort cleanup of associated media blobs.
      try {
        if (box?.type === 'image' && box.content?.mediaId) await deleteMedia(box.content.mediaId)
        if (box?.type === 'video' && box.content?.mediaId) await deleteMedia(box.content.mediaId)
      } catch (err) {
        console.warn('Media cleanup failed', err)
      }
    },
    [doc.boxes, updateDoc]
  )

  const copyBox = useCallback(
    (id) => {
      let newId = null
      updateDoc((prev) => {
        const original = prev.boxes.find((b) => b.id === id)
        if (!original) return prev
        const { label, counters } = nextLabel(prev.counters || {}, original.type)
        const copy = { ...cloneBoxForCopy(original), label }
        newId = copy.id
        return { ...prev, counters, boxes: [...prev.boxes, copy] }
      })
      if (newId) setSelectedId(newId)
      return newId
    },
    [updateDoc]
  )

  const deleteAllBoxes = useCallback(() => {
    updateDoc((prev) => ({ ...prev, boxes: [] }))
    setSelectedId(null)
    setExpandedId(null)
  }, [updateDoc])

  const bringToFront = useCallback(
    (id) => {
      updateDoc((prev) => {
        const box = prev.boxes.find((b) => b.id === id)
        if (!box) return prev
        const others = prev.boxes.filter((b) => b.id !== id)
        return { ...prev, boxes: [...others, box] }
      }, { record: false })
    },
    [updateDoc]
  )

  const renameCurrentDocument = useCallback(
    (name) => {
      updateDoc((prev) => ({ ...prev, name }))
    },
    [updateDoc]
  )

  // ---------- Document (file) operations ----------

  const newDocument = useCallback(() => {
    const fresh = createEmptyDocument('Untitled')
    documentStorage.saveDocument(fresh)
    reset(fresh)
    setSelectedId(null)
    setExpandedId(null)
  }, [reset])

  const openDocument = useCallback(
    (id) => {
      const loaded = documentStorage.getDocument(id)
      if (!loaded) return false
      reset(loaded)
      setSelectedId(null)
      setExpandedId(null)
      return true
    },
    [reset]
  )

  const value = {
    doc,
    selectedId,
    setSelectedId,
    expandedId,
    setExpandedId,
    saveStatus,
    canUndo,
    canRedo,
    undo,
    redo,
    addBox,
    updateBox,
    deleteBox,
    copyBox,
    deleteAllBoxes,
    bringToFront,
    beginTransientEdit,
    endTransientEdit,
    renameCurrentDocument,
    newDocument,
    openDocument,
  }

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
}

export function useDocumentStore() {
  const ctx = useContext(DocumentContext)
  if (!ctx) throw new Error('useDocumentStore must be used within DocumentProvider')
  return ctx
}

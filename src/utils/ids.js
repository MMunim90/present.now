// Reliable unique ID generation. Uses crypto.randomUUID when available,
// falls back to a timestamp+random string otherwise (older browsers / non-secure contexts).

export function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Produces human-friendly, per-type incremental ids like "text-1", "code-2",
// while the underlying key stored in state is always a full UUID for reliability.
// counters: { text: 0, image: 0, ... } kept alongside the document.
export function nextLabel(counters, type) {
  const n = (counters[type] || 0) + 1
  return { label: `${type}-${n}`, counters: { ...counters, [type]: n } }
}

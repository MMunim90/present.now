import { uuid } from './ids'

export const PAGE_WIDTH = 1120
export const PAGE_MIN_HEIGHT = 780

export function createEmptyDocument(name = 'Untitled') {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    name,
    theme: 'light',
    createdAt: now,
    updatedAt: now,
    counters: {},
    boxes: [],
    connections: [],
  }
}

const DEFAULTS_BY_TYPE = {
  text: { width: 360, height: 160 },
  image: { width: 360, height: 260 },
  video: { width: 420, height: 260 },
  code: { width: 460, height: 300 },
  output: { width: 420, height: 220 },
}

let cascadeCounter = 0

export function createBox(type, overrides = {}) {
  const base = DEFAULTS_BY_TYPE[type] || { width: 320, height: 200 }
  cascadeCounter = (cascadeCounter + 1) % 8
  const offset = cascadeCounter * 24

  const common = {
    id: uuid(),
    type,
    label: overrides.label || `${type}-1`,
    x: 60 + offset,
    y: 60 + offset,
    width: base.width,
    height: base.height,
    zoom: 100,
    locked: false,
    createdAt: new Date().toISOString(),
  }

  switch (type) {
    case 'text':
      return {
        ...common,
        // content: 'Start typing.....',
        style: {
          fontSize: 16,
          fontFamily: 'Inter',
          bold: false,
          italic: false,
          underline: false,
          textAlign: 'left',
          color: '#808080',
          background: 'transparent',
        },
        ...overrides,
      }
    case 'image':
      return {
        ...common,
        content: { mediaId: null, name: null },
        style: { objectFit: 'cover' },
        ...overrides,
      }
    case 'video':
      return {
        ...common,
        content: { source: 'url', url: '', mediaId: null },
        style: {},
        loop: false,
        ...overrides,
      }
    case 'code':
      return {
        ...common,
        content: '// Write or paste code here\n',
        language: 'javascript',
        style: {},
        ...overrides,
      }
    case 'output':
      return {
        ...common,
        content: 'Output will appear here…',
        style: {},
        ...overrides,
      }
    default:
      return { ...common, content: '', style: {}, ...overrides }
  }
}

export function cloneBoxForCopy(box) {
  return {
    ...JSON.parse(JSON.stringify(box)),
    id: uuidFallback(),
    x: box.x + 24,
    y: box.y + 24,
    createdAt: new Date().toISOString(),
  }
}

function uuidFallback() {
  return uuid()
}

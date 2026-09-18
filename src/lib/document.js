export const BOX_TYPES = ['text', 'image', 'video', 'code', 'output']

const defaults = {
  text: { width: 340, height: 190, content: '' },
  image: { width: 360, height: 260, content: '' },
  video: { width: 380, height: 240, content: '' },
  code: { width: 420, height: 260, content: '// Start writing here', metadata: { language: 'JavaScript' } },
  output: { width: 380, height: 210, content: '' },
}

export function createBox(type, index = 0) {
  const config = defaults[type]
  return {
    id: crypto.randomUUID(),
    type,
    x: 72 + (index % 4) * 32,
    y: 72 + (index % 4) * 32,
    width: config.width,
    height: config.height,
    zoom: 1,
    content: config.content,
    style: {},
    metadata: config.metadata ?? {},
  }
}

import { mediaStorage } from '../storage/mediaStorage'

const scripts = {
  pdf: ['https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js', 'jspdf'],
  pptx: ['https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js', 'PptxGenJS'],
  docx: ['https://cdn.jsdelivr.net/npm/docx@9.5.1/dist/index.umd.js', 'docx'],
}

function loadLibrary(kind) {
  const [url, globalName] = scripts[kind]
  if (window[globalName]) return Promise.resolve(window[globalName])
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-present-now-library="${kind}"]`)
    if (existing) { existing.addEventListener('load', () => resolve(window[globalName])); existing.addEventListener('error', () => reject(new Error('Library failed to load'))); return }
    const script = document.createElement('script')
    script.src = url; script.async = true; script.dataset.presentNowLibrary = kind
    script.onload = () => window[globalName] ? resolve(window[globalName]) : reject(new Error('Library did not initialise'))
    script.onerror = () => reject(new Error('Library failed to load'))
    document.head.appendChild(script)
  })
}

const plainText = (value = '') => {
  const element = document.createElement('div')
  element.innerHTML = value
  return (element.textContent || element.innerText || '').trim()
}
const fileName = (title, extension) => `${(title || 'Untitled').replace(/[<>:"/\\|?*]/g, '-').trim() || 'Untitled'}.${extension}`
const pageHeight = (pageDocument) => Math.max(720, ...pageDocument.boxes.map((box) => box.y + box.height * box.zoom + 72))
const boxText = (box) => box.type === 'video' ? (box.content ? `Video: ${box.content}` : 'Video placeholder') : plainText(box.content)
const download = (blob, name) => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1_000) }

async function imageData(box) {
  if (!box.metadata?.imageId) return null
  const blob = await mediaStorage.getImage(box.metadata.imageId)
  if (!blob) return null
  return { dataUrl: await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob) }), data: new Uint8Array(await blob.arrayBuffer()), type: blob.type }
}

export async function exportPdf(pageDocument) {
  const jspdf = await loadLibrary('pdf')
  const { jsPDF } = jspdf
  const width = 1120; const height = pageHeight(pageDocument)
  const pdf = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'pt', format: [width, height] })
  const dark = pageDocument.theme === 'dark'
  pdf.setFillColor(dark ? '#292927' : '#ffffff'); pdf.rect(0, 0, width, height, 'F')
  for (const box of pageDocument.boxes) {
    const x = box.x; const y = box.y; const w = box.width * box.zoom; const h = box.height * box.zoom
    pdf.setFillColor(dark ? '#30302e' : '#ffffff'); pdf.setDrawColor(dark ? '#474743' : '#deded9'); pdf.roundedRect(x, y, w, h, 8, 8, 'FD')
    pdf.setFillColor(dark ? '#30302e' : '#fbfbfa'); pdf.rect(x, y, w, 28, 'F')
    pdf.setTextColor(dark ? '#d8d8d2' : '#555550'); pdf.setFontSize(9); pdf.text(box.type.toUpperCase(), x + 10, y + 18)
    if (box.type === 'image') {
      const image = await imageData(box)
      if (image) pdf.addImage(image.dataUrl, x + 1, y + 29, w - 2, h - 30)
      else pdf.text('Image unavailable', x + 12, y + 48)
    } else {
      const text = boxText(box) || (box.type === 'video' ? 'Video placeholder' : '')
      pdf.setTextColor(box.type === 'code' ? '#d8d8d2' : dark ? '#e6e6df' : '#292926')
      if (box.type === 'code') { pdf.setFillColor('#20211f'); pdf.rect(x + 1, y + 29, w - 2, h - 30, 'F') }
      pdf.setFont(box.type === 'code' || box.type === 'output' ? 'courier' : 'helvetica', 'normal'); pdf.setFontSize(box.type === 'code' ? 9 : 11)
      pdf.text(pdf.splitTextToSize(text, w - 24), x + 12, y + 46, { baseline: 'top', maxWidth: w - 24 })
    }
  }
  pdf.save(fileName(pageDocument.title, 'pdf'))
}

export async function exportPptx(pageDocument) {
  const PptxGenJS = await loadLibrary('pptx')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'present.now'; pptx.subject = pageDocument.title
  const slide = pptx.addSlide(); const scale = 13.333 / 1120; const dark = pageDocument.theme === 'dark'
  slide.background = { color: dark ? '292927' : 'FFFFFF' }
  for (const box of pageDocument.boxes) {
    const x = box.x * scale; const y = box.y * scale; const w = box.width * box.zoom * scale; const h = box.height * box.zoom * scale
    slide.addShape(pptx.ShapeType.rect, { x, y, w, h, rectRadius: 0.08, fill: { color: box.type === 'code' ? '20211F' : dark ? '30302E' : 'FFFFFF' }, line: { color: dark ? '474743' : 'DEDED9', pt: 0.8 } })
    if (box.type === 'image') {
      const image = await imageData(box)
      if (image) slide.addImage({ data: image.dataUrl, x: x + 0.02, y: y + 0.02, w: w - 0.04, h: h - 0.04, sizing: { type: 'contain', x, y, w, h } })
      else slide.addText('Image unavailable', { x: x + 0.12, y: y + 0.18, w: w - 0.24, h: 0.25, fontSize: 10 })
    } else slide.addText(boxText(box) || (box.type === 'video' ? 'Video placeholder' : ''), { x: x + 0.12, y: y + 0.16, w: w - 0.24, h: h - 0.28, fontFace: box.type === 'code' || box.type === 'output' ? 'Courier New' : 'Aptos', fontSize: box.type === 'code' ? 8 : 11, color: box.type === 'code' ? 'D8D8D2' : dark ? 'E6E6DF' : '292926', breakLine: false, margin: 0.03, valign: 'top', fit: 'shrink' })
  }
  await pptx.writeFile({ fileName: fileName(pageDocument.title, 'pptx') })
}

export async function exportDocx(pageDocument) {
  const docx = await loadLibrary('docx')
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = docx
  const children = [new Paragraph({ text: pageDocument.title || 'Untitled', heading: HeadingLevel.TITLE })]
  for (const box of pageDocument.boxes) {
    children.push(new Paragraph({ text: `${box.type.charAt(0).toUpperCase()}${box.type.slice(1)} box`, heading: HeadingLevel.HEADING_2 }))
    if (box.type === 'image') {
      const image = await imageData(box)
      if (image) children.push(new Paragraph({ children: [new ImageRun({ data: image.data, type: image.type === 'image/png' ? 'png' : 'jpg', transformation: { width: Math.min(560, box.width), height: Math.min(360, box.height) } })] }))
      else children.push(new Paragraph('Image unavailable locally.'))
    } else if (box.type === 'code' || box.type === 'output') children.push(new Paragraph({ children: [new TextRun({ text: boxText(box), font: 'Courier New' })] }))
    else children.push(new Paragraph(boxText(box) || (box.type === 'video' ? 'Video: no URL supplied.' : '')))
  }
  const blob = await Packer.toBlob(new Document({ sections: [{ children }] }))
  download(blob, fileName(pageDocument.title, 'docx'))
}

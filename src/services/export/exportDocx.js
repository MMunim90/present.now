import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, ShadingType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { getMedia } from '../../services/storage/mediaStorage'
import { sanitizeFilename } from './exportPdf'

const ALIGN_MAP = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

export async function exportToDocx(doc) {
  const orderedBoxes = [...doc.boxes].sort((a, b) => a.y - b.y || a.x - b.x)
  const children = [
    new Paragraph({
      text: doc.name || 'Untitled',
      heading: HeadingLevel.TITLE,
    }),
  ]

  for (const box of orderedBoxes) {
    try {
      if (box.type === 'text') {
        children.push(
          new Paragraph({
            alignment: ALIGN_MAP[box.style.textAlign] || AlignmentType.LEFT,
            shading:
              box.style.background && box.style.background !== 'transparent'
                ? { type: ShadingType.CLEAR, fill: box.style.background.replace('#', ''), color: 'auto' }
                : undefined,
            children: (box.content || '').split('\n').flatMap((line, i, arr) => {
              const run = new TextRun({
                text: line,
                bold: !!box.style.bold,
                italics: !!box.style.italic,
                underline: box.style.underline ? {} : undefined,
                color: (box.style.color || '#111827').replace('#', ''),
                size: Math.round((box.style.fontSize || 16) * 1.6),
                font: box.style.fontFamily || 'Calibri',
              })
              return i < arr.length - 1 ? [run, new TextRun({ break: 1 })] : [run]
            }),
            spacing: { after: 200 },
          })
        )
      } else if (box.type === 'code') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `// ${box.language}`, italics: true, color: '6B7280', font: 'Consolas', size: 18 })],
            spacing: { before: 200 },
          }),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: '1E1E1E', color: 'auto' },
            children: (box.content || '').split('\n').flatMap((line, i, arr) => {
              const run = new TextRun({ text: line || ' ', font: 'Consolas', size: 18, color: 'D4D4D4' })
              return i < arr.length - 1 ? [run, new TextRun({ break: 1 })] : [run]
            }),
            spacing: { after: 200 },
          })
        )
      } else if (box.type === 'output') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'OUTPUT', bold: true, size: 16, color: '9CA3AF' })],
            spacing: { before: 100 },
          }),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: 'FAFAFA', color: 'auto' },
            children: (box.content || '').split('\n').flatMap((line, i, arr) => {
              const run = new TextRun({ text: line || ' ', font: 'Consolas', size: 18, color: '374151' })
              return i < arr.length - 1 ? [run, new TextRun({ break: 1 })] : [run]
            }),
            spacing: { after: 200 },
          })
        )
      } else if (box.type === 'image' && box.content?.mediaId) {
        const record = await getMedia(box.content.mediaId)
        if (record?.blob) {
          const arrayBuffer = await record.blob.arrayBuffer()
          const ratio = box.height / box.width
          const targetWidth = 500
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: { width: targetWidth, height: Math.round(targetWidth * ratio) },
                }),
              ],
              spacing: { after: 200 },
            })
          )
        }
      } else if (box.type === 'video') {
        const label = box.content?.source === 'local' ? '[Local video attached in app — not embeddable in DOCX]' : `Video: ${box.content?.url || '(no source set)'}`
        children.push(
          new Paragraph({
            children: [new TextRun({ text: label, italics: true, color: '6B7280' })],
            spacing: { after: 200 },
          })
        )
      }
    } catch (err) {
      console.warn('Failed to export box to DOCX', box.id, err)
    }
  }

  const document = new Document({
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(document)
  saveAs(blob, `${sanitizeFilename(doc.name)}.docx`)
}

import PptxGenJS from 'pptxgenjs'
import { mediaToDataUrl } from '../../utils/exportHelpers'
import { sanitizeFilename } from './exportPdf'
import { resolveVideoUrl } from '../../utils/video'
import { getContentBounds } from '../../utils/canvasSize'

const SLIDE_W = 13.333 // inches, 16:9
const SLIDE_H = 7.5

export async function exportToPptx(doc, pageWidth) {
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'PRESENT_NOW', width: SLIDE_W, height: SLIDE_H })
  pptx.layout = 'PRESENT_NOW'

  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }

  const pageHeightPx = Math.max(getContentBounds(doc.boxes).height, 1)
  const scaleX = SLIDE_W / pageWidth
  const scaleY = SLIDE_H / pageHeightPx

  for (const box of doc.boxes) {
    const x = box.x * scaleX
    const y = box.y * scaleY
    const w = Math.max(0.3, box.width * scaleX)
    const h = Math.max(0.3, box.height * scaleY)

    try {
      if (box.type === 'text') {
        slide.addText(box.content || '', {
          x,
          y,
          w,
          h,
          fontFace: box.style.fontFamily || 'Arial',
          fontSize: Math.max(8, Math.round((box.style.fontSize || 16) * 0.75)),
          bold: !!box.style.bold,
          italic: !!box.style.italic,
          underline: !!box.style.underline,
          align: box.style.textAlign === 'justify' ? 'left' : box.style.textAlign || 'left',
          color: (box.style.color || '#111827').replace('#', ''),
          fill: box.style.background && box.style.background !== 'transparent' ? { color: box.style.background.replace('#', '') } : undefined,
          valign: 'top',
          wrap: true,
        })
      } else if (box.type === 'image' && box.content?.mediaId) {
        const dataUrl = await mediaToDataUrl(box.content.mediaId)
        if (dataUrl) slide.addImage({ data: dataUrl, x, y, w, h, sizing: { type: 'cover', w, h } })
      } else if (box.type === 'video') {
        if (box.content?.source === 'local' && box.content?.mediaId) {
          const dataUrl = await mediaToDataUrl(box.content.mediaId)
          if (dataUrl) {
            slide.addMedia({ type: 'video', data: dataUrl, x, y, w, h })
          }
        } else if (box.content?.url) {
          const resolved = resolveVideoUrl(box.content.url)
          if (resolved.kind === 'embed' && /youtube/.test(resolved.src)) {
            slide.addMedia({ type: 'online', link: resolved.src, x, y, w, h })
          } else {
            addPlaceholder(slide, x, y, w, h, `Video link:\n${box.content.url}`, '1E1E1E', 'FFFFFF')
          }
        } else {
          addPlaceholder(slide, x, y, w, h, 'Video (no source set)', '1E1E1E', 'FFFFFF')
        }
      } else if (box.type === 'code') {
        addPlaceholder(slide, x, y, w, h, box.content || '', '1E1E1E', 'D4D4D4', true)
      } else if (box.type === 'output') {
        addPlaceholder(slide, x, y, w, h, box.content || '', 'FAFAFA', '374151', true, true)
      }
    } catch (err) {
      console.warn('Failed to export box to PPTX', box.id, err)
    }
  }

  await pptx.writeFile({ fileName: `${sanitizeFilename(doc.name)}.pptx` })
}

function addPlaceholder(slide, x, y, w, h, text, fillColor, textColor, mono = false, outline = false) {
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: fillColor },
    line: outline ? { color: 'D1D5DB', width: 1 } : { type: 'none' },
    rectRadius: 0.05,
  })
  slide.addText(text, {
    x: x + 0.08,
    y: y + 0.06,
    w: w - 0.16,
    h: h - 0.12,
    fontFace: mono ? 'Courier New' : 'Arial',
    fontSize: 10,
    color: textColor,
    valign: 'top',
    align: 'left',
    wrap: true,
  })
}

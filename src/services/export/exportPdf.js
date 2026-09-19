import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// Renders the live #present-now-page DOM node to a canvas and drops it into a
// PDF, scaled to fit a single page (portrait or landscape, whichever fits best).
export async function exportToPdf(doc) {
  const pageEl = document.getElementById('present-now-page')
  if (!pageEl) throw new Error('Canvas element not found')

  // Temporarily deselect boxes so toolbars/handles are not captured.
  const previouslySelected = document.activeElement
  previouslySelected?.blur?.()

  const canvas = await html2canvas(pageEl, {
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    backgroundColor: getComputedStyle(pageEl).backgroundColor || '#ffffff',
    useCORS: true,
    logging: false,
    ignoreElements: (el) => el.dataset && el.dataset.exportIgnore === 'true',
  })

  const imgData = canvas.toDataURL('image/png')
  const orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height)
  const renderW = canvas.width * ratio
  const renderH = canvas.height * ratio
  const offsetX = (pageW - renderW) / 2
  const offsetY = (pageH - renderH) / 2

  pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderW, renderH, undefined, 'FAST')
  pdf.save(`${sanitizeFilename(doc.name)}.pdf`)
}

export function sanitizeFilename(name) {
  return (name || 'present-now-document').trim().replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '-') || 'present-now-document'
}

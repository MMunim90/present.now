// The canvas must be "content-aware": it should never be smaller than what
// the boxes actually occupy, regardless of what the visible workspace
// measures. This is intentionally pure/DOM-free so it can be reused both by
// the live canvas (for rendering) and by the export pipeline (for scaling
// box coordinates), and stays perfectly in sync with the two.

export const PAGE_PADDING = 60

export function getContentBounds(boxes) {
  if (!boxes || boxes.length === 0) {
    return { width: 0, height: 0 }
  }
  let maxRight = 0
  let maxBottom = 0
  for (const box of boxes) {
    maxRight = Math.max(maxRight, box.x + box.width)
    maxBottom = Math.max(maxBottom, box.y + box.height)
  }
  return { width: maxRight + PAGE_PADDING, height: maxBottom + PAGE_PADDING }
}

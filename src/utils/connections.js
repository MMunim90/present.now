import { uuid } from './ids'

// The four supported connection-point locations, always attached to the
// box's own border — never floating, never an arbitrary point on the box.
export const CONNECTION_POINTS = ['top', 'right', 'bottom', 'left']

// Computes a connection point's coordinates directly from the box's own
// position/dimensions, in the same canvas coordinate space box.x/box.y
// already live in (never viewport coordinates). Because a box's zoom only
// scales its *inner content* (see BaseBox) and never the box's own
// width/height, these coordinates stay correct at any zoom level.
export function getConnectionPointCoords(box, point) {
  switch (point) {
    case 'top':
      return { x: box.x + box.width / 2, y: box.y }
    case 'right':
      return { x: box.x + box.width, y: box.y + box.height / 2 }
    case 'bottom':
      return { x: box.x + box.width / 2, y: box.y + box.height }
    case 'left':
    default:
      return { x: box.x, y: box.y + box.height / 2 }
  }
}

export function createConnection(sourceBoxId, sourcePoint, targetBoxId, targetPoint) {
  return {
    id: uuid(),
    sourceBoxId,
    sourcePoint,
    targetBoxId,
    targetPoint,
  }
}

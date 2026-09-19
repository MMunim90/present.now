// Resolves a pasted video URL into a renderable form: either an iframe embed
// (YouTube/Vimeo) or a direct <video> source.

export function resolveVideoUrl(rawUrl) {
  if (!rawUrl) return null
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    return { kind: 'invalid' }
  }

  const host = url.hostname.replace('www.', '')

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = url.searchParams.get('v')
    if (id) return { kind: 'embed', src: `https://www.youtube.com/embed/${id}` }
    const shortsMatch = url.pathname.match(/\/(shorts|embed)\/([^/?]+)/)
    if (shortsMatch) return { kind: 'embed', src: `https://www.youtube.com/embed/${shortsMatch[2]}` }
    return { kind: 'invalid' }
  }

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    if (id) return { kind: 'embed', src: `https://www.youtube.com/embed/${id}` }
    return { kind: 'invalid' }
  }

  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    if (id) return { kind: 'embed', src: `https://player.vimeo.com/video/${id}` }
    return { kind: 'invalid' }
  }

  if (/\.(mp4|webm|ogg|mov)$/i.test(url.pathname)) {
    return { kind: 'file', src: url.toString() }
  }

  // Fall back: try it as a direct video source (some CDNs omit extensions).
  return { kind: 'file', src: url.toString() }
}

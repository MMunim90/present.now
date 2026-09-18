import { ExternalLink, PlaySquare } from 'lucide-react'
import BaseBox from './BaseBox'

export default function VideoBox({ box, ...props }) {
  const url = box.content.trim()
  let parsedUrl = null
  try { parsedUrl = url ? new URL(url) : null } catch { /* Display a helpful local validation state below. */ }
  const isHttpUrl = parsedUrl?.protocol === 'https:' || parsedUrl?.protocol === 'http:'
  const host = parsedUrl?.hostname.toLowerCase()
  const youtubeId = host === 'youtu.be' || host?.endsWith('.youtu.be') ? parsedUrl.pathname.slice(1) : host === 'youtube.com' || host?.endsWith('.youtube.com') ? parsedUrl.searchParams.get('v') : null
  const vimeoMatch = (host === 'vimeo.com' || host?.endsWith('.vimeo.com')) && parsedUrl.pathname.match(/\/(\d+)/)
  const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : vimeoMatch ? `https://player.vimeo.com/video/${vimeoMatch[1]}` : url
  const isEmbed = Boolean(youtubeId || vimeoMatch)
  return <BaseBox box={box} {...props}><div className="video-box-content">{url && !isHttpUrl ? <div className="media-placeholder video-placeholder"><PlaySquare size={28} /><strong>Enter a valid video URL</strong><span>Use an http(s) YouTube, Vimeo, or direct video link.</span></div> : url ? <div className="video-preview">{isEmbed ? <iframe src={embedUrl} title="Video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video controls src={url}>Your browser cannot preview this video.</video>}</div> : <div className="media-placeholder video-placeholder"><PlaySquare size={28} /><strong>Paste a video URL</strong><span>Direct MP4 or YouTube links work best</span></div>}<label className="video-url-input"><ExternalLink size={13} /><input value={box.content} onChange={(event) => props.onChange(event.target.value)} placeholder="Paste video URL…" aria-label="Video URL" inputMode="url" /></label></div></BaseBox>
}

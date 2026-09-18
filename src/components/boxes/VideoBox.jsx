import { ExternalLink, PlaySquare } from 'lucide-react'
import BaseBox from './BaseBox'

export default function VideoBox({ box, ...props }) {
  const url = box.content.trim()
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  const embedUrl = url.includes('youtube.com/watch') ? url.replace('watch?v=', 'embed/') : url.includes('youtu.be/') ? `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}` : vimeoMatch ? `https://player.vimeo.com/video/${vimeoMatch[1]}` : url
  return <BaseBox box={box} {...props}><div className="video-box-content">{url ? <div className="video-preview">{embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com') ? <iframe src={embedUrl} title="Video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video controls src={url}>Your browser cannot preview this video.</video>}</div> : <div className="media-placeholder video-placeholder"><PlaySquare size={28} /><strong>Paste a video URL</strong><span>Direct MP4 or YouTube links work best</span></div>}<label className="video-url-input"><ExternalLink size={13} /><input value={box.content} onChange={(event) => props.onChange(event.target.value)} placeholder="Paste video URL…" aria-label="Video URL" /></label></div></BaseBox>
}

import React, { useRef, useState } from 'react'
import { Link2, Upload, Film } from 'lucide-react'
import BaseBox from './BaseBox'
import IconButton from '../ui/IconButton'
import { useDocumentStore } from '../../store/DocumentContext'
import { useMediaUrl } from '../../hooks/useMediaUrl'
import { saveMedia, deleteMedia } from '../../services/storage/mediaStorage'
import { uuid } from '../../utils/ids'
import { resolveVideoUrl } from '../../utils/video'

const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60MB safety cap for local video

export default function VideoBox({ box, pageRef }) {
  const { updateBox } = useDocumentStore()
  const fileInputRef = useRef(null)
  const [urlDraft, setUrlDraft] = useState(box.content?.url || '')
  const [error, setError] = useState(null)
  const localUrl = useMediaUrl(box.content?.source === 'local' ? box.content?.mediaId : null)

  const applyUrl = () => {
    setError(null)
    if (!urlDraft.trim()) return
    const resolved = resolveVideoUrl(urlDraft.trim())
    if (resolved.kind === 'invalid') {
      setError('That link does not look like a valid video URL.')
      return
    }
    updateBox(box.id, { content: { source: 'url', url: urlDraft.trim(), mediaId: null } })
  }

  const handleFile = async (file) => {
    setError(null)
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setError('Please choose a valid video file.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Video is too large (max 60MB for local storage).')
      return
    }
    try {
      const previousMediaId = box.content?.mediaId
      const mediaId = uuid()
      await saveMedia(mediaId, file, file.type)
      updateBox(box.id, { content: { source: 'local', mediaId, url: '' } })
      if (previousMediaId) await deleteMedia(previousMediaId)
    } catch (err) {
      console.error(err)
      setError('Failed to store video locally. Storage may be full.')
    }
  }

  const resolved = box.content?.source === 'url' && box.content?.url ? resolveVideoUrl(box.content.url) : null

  return (
    <BaseBox
      box={box}
      pageRef={pageRef}
      extraControls={<IconButton icon={Upload} label="Upload local video" size="sm" onClick={() => fileInputRef.current?.click()} />}
      secondaryToolbar={
        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
          <Link2 size={14} className="shrink-0 text-gray-400" />
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
            placeholder="Paste a YouTube, Vimeo, or direct video URL…"
            aria-label="Video URL"
            className="h-7 min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
          />
          <button
            onClick={applyUrl}
            className="h-7 shrink-0 rounded-md bg-accent-500 px-2.5 text-xs font-medium text-white hover:bg-accent-600"
          >
            Set
          </button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        aria-label="Upload local video"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex h-full min-h-[160px] w-full items-center justify-center bg-black">
        {box.content?.source === 'local' && localUrl.url ? (
          <video src={localUrl.url} controls className="h-full w-full" />
        ) : resolved?.kind === 'embed' ? (
          <iframe
            title={box.label}
            src={resolved.src}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : resolved?.kind === 'file' ? (
          <video src={resolved.src} controls className="h-full w-full" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-gray-400">
            <Film size={28} />
            <span className="text-xs font-medium">Paste a video URL above or upload a local file</span>
          </div>
        )}
      </div>
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 dark:bg-red-900/50 dark:text-red-300">
          {error}
        </div>
      )}
    </BaseBox>
  )
}

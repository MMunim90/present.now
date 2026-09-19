import React from 'react'
import BaseBox from './BaseBox'
import TextEditorToolbar from '../editor/TextEditor'
import { useDocumentStore } from '../../store/DocumentContext'

export default function TextBox({ box, pageRef }) {
  const { updateBox, expandedId } = useDocumentStore()
  const expanded = expandedId === box.id

  const textStyle = {
    fontFamily: box.style.fontFamily,
    fontSize: box.style.fontSize,
    fontWeight: box.style.bold ? 700 : 400,
    fontStyle: box.style.italic ? 'italic' : 'normal',
    textDecoration: box.style.underline ? 'underline' : 'none',
    textAlign: box.style.textAlign,
    color: box.style.color,
    background: box.style.background,
  }

  return (
    <BaseBox
      box={box}
      pageRef={pageRef}
      secondaryToolbar={<TextEditorToolbar style={box.style} onChange={(style) => updateBox(box.id, { style })} />}
    >
      <textarea
        value={box.content}
        onChange={(e) => updateBox(box.id, { content: e.target.value }, { record: false })}
        onBlur={(e) => updateBox(box.id, { content: e.target.value })}
        placeholder="Type something…"
        aria-label="Text box content"
        className="h-full min-h-[100px] w-full resize-none border-none bg-transparent p-4 leading-relaxed outline-none placeholder:text-gray-400"
        style={{ ...textStyle, minHeight: expanded ? '60vh' : undefined }}
      />
    </BaseBox>
  )
}

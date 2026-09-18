import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from 'lucide-react'

const alignments = [{ command: 'justifyLeft', label: 'Align left', icon: AlignLeft }, { command: 'justifyCenter', label: 'Align center', icon: AlignCenter }, { command: 'justifyRight', label: 'Align right', icon: AlignRight }]

export default function RichTextEditor({ value, onChange, expanded = false }) {
  const command = (name, commandValue) => {
    globalThis.document.execCommand(name, false, commandValue)
    onChange(globalThis.document.getSelection()?.anchorNode?.parentElement?.closest('[contenteditable]')?.innerHTML ?? value)
  }
  const toolbarAction = (name, commandValue) => (event) => { event.preventDefault(); command(name, commandValue) }
  return <div className={`rich-text-editor ${expanded ? 'is-expanded' : ''}`}><div className="formatting-toolbar" onPointerDown={(event) => event.stopPropagation()} aria-label="Text formatting">
    <select aria-label="Font family" defaultValue="Inter" onChange={(event) => command('fontName', event.target.value)}><option>Inter</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option><option>Courier New</option></select>
    <select aria-label="Font size" defaultValue="3" onChange={(event) => command('fontSize', event.target.value)}><option value="1">12px</option><option value="2">14px</option><option value="3">16px</option><option value="4">18px</option><option value="5">24px</option><option value="6">32px</option><option value="7">40px</option></select>
    <input className="color-input" type="color" aria-label="Text color" defaultValue="#292926" onChange={(event) => command('foreColor', event.target.value)} />
    <span className="format-divider" />
    <button type="button" onMouseDown={toolbarAction('bold')} title="Bold" aria-label="Bold"><Bold size={14} /></button><button type="button" onMouseDown={toolbarAction('italic')} title="Italic" aria-label="Italic"><Italic size={14} /></button><button type="button" onMouseDown={toolbarAction('underline')} title="Underline" aria-label="Underline"><Underline size={14} /></button><span className="format-divider" />
    {alignments.map(({ command: name, label, icon: Icon }) => <button type="button" key={name} onMouseDown={toolbarAction(name)} title={label} aria-label={label}><Icon size={14} /></button>)}
  </div><div className="rich-text-content" contentEditable suppressContentEditableWarning data-placeholder="Write something meaningful…" dangerouslySetInnerHTML={{ __html: value }} onInput={(event) => onChange(event.currentTarget.innerHTML)} /></div>
}

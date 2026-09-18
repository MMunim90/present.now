import BaseBox from './BaseBox'
import { Copy, Eraser } from 'lucide-react'

export default function OutputBox({ box, ...props }) {
  const copy = async () => { try { await navigator.clipboard.writeText(box.content) } catch { /* Clipboard permission is optional. */ } }
  return <BaseBox box={box} {...props}><div className="output-editor"><div className="output-actions"><span>Output</span><button type="button" onClick={copy} title="Copy output" aria-label="Copy output"><Copy size={13} /></button><button type="button" onClick={() => props.onChange('')} title="Clear output" aria-label="Clear output"><Eraser size={13} /></button></div><textarea className="box-textarea output-content" value={box.content} onChange={(event) => props.onChange(event.target.value)} onPointerDown={(event) => event.stopPropagation()} placeholder="Output will appear here…" aria-label="Output box content" /></div></BaseBox>
}

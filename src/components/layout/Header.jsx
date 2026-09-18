import { useState } from 'react'
import { Braces, ChevronDown, FilePlus2, FileText, FolderOpen, Image, Moon, Plus, Save, Sun, TerminalSquare, Video } from 'lucide-react'
import IconButton from '../ui/IconButton'

const addOptions = [{ type: 'text', label: 'Text', icon: FileText }, { type: 'image', label: 'Image', icon: Image }, { type: 'video', label: 'Video', icon: Video }, { type: 'code', label: 'Code', icon: Braces }, { type: 'output', label: 'Output', icon: TerminalSquare }]

export default function Header({ theme, saveStatus, onThemeToggle, onAddBox, onNewDocument, onOpenDocuments }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <header className="app-header">
    <div className="header-brand" aria-label="present.now home"><span className="brand-mark" aria-hidden="true"><span /></span><span className="brand-name">present<span>.now</span></span></div>
    <div className="header-actions"><button className="button button-quiet" type="button" onClick={onNewDocument}><FilePlus2 size={16} /><span>New</span></button><button className="button button-quiet documents-button" type="button" onClick={onOpenDocuments}><FolderOpen size={16} /><span>Documents</span></button><div className="add-box-menu"><button className="button button-primary" type="button" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen((open) => !open)}><Plus size={16} /><span>Add box</span><ChevronDown size={14} /></button>{menuOpen && <div className="add-menu-popover" role="menu">{addOptions.map(({ type, label, icon: Icon }) => <button type="button" role="menuitem" key={type} onClick={() => { onAddBox(type); setMenuOpen(false) }}><Icon size={16} /><span>{label}</span></button>)}</div>}</div></div>
    <div className="header-tools"><span className={`save-status ${saveStatus === 'Unable to save locally' ? 'save-error' : ''}`} title="Changes are stored only in your browser"><Save size={14} /><span>{saveStatus}</span></span><IconButton label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} onClick={onThemeToggle}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</IconButton><button className="button button-quiet export-button" type="button"><span>Export</span><ChevronDown size={15} /></button></div>
  </header>
}

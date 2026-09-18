import { Copy } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'

const languageMap = { JavaScript: 'javascript', TypeScript: 'typescript', Python: 'python', C: 'c', 'C++': 'cpp', Java: 'java', HTML: 'markup', CSS: 'css', SQL: 'sql', JSON: 'json', Bash: 'bash' }
const languages = Object.keys(languageMap)

export default function CodeEditor({ value, language, onChange, onLanguageChange, expanded = false }) {
  const grammar = Prism.languages[languageMap[language]] || Prism.languages.plain
  const highlighted = Prism.highlight(value || ' ', grammar, languageMap[language])
  const lines = Math.max(1, value.split('\n').length)
  const copy = async () => { try { await navigator.clipboard.writeText(value) } catch { /* Clipboard permission is optional. */ } }
  return <div className={`developer-editor ${expanded ? 'is-expanded' : ''}`}><div className="editor-topbar"><select value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label="Code language">{languages.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={copy} title="Copy code" aria-label="Copy code"><Copy size={13} />Copy</button></div><div className="editor-surface"><div className="line-numbers" aria-hidden="true">{Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}</div><pre aria-hidden="true"><code className={`language-${languageMap[language]}`} dangerouslySetInnerHTML={{ __html: highlighted }} /></pre><textarea value={value} onChange={(event) => onChange(event.target.value)} spellCheck="false" aria-label="Code editor" /></div></div>
}

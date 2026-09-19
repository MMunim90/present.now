import React, { useMemo } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'

const LANGUAGE_TO_PRISM = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  html: 'markup',
  css: 'css',
  sql: 'sql',
  json: 'json',
  bash: 'bash',
}

export default function CodeEditor({ code, language, onChange, readOnly = false, minHeight = 200 }) {
  const grammar = useMemo(() => Prism.languages[LANGUAGE_TO_PRISM[language]] || Prism.languages.javascript, [language])
  const lineCount = (code.match(/\n/g)?.length || 0) + 1

  const highlight = (src) => Prism.highlight(src, grammar, LANGUAGE_TO_PRISM[language] || 'javascript')

  return (
    <div className="flex h-full w-full bg-[#1e1e1e] font-mono text-[13px] leading-6" style={{ minHeight }}>
      <div
        aria-hidden="true"
        className="select-none border-r border-white/10 px-3 py-3 text-right text-[#5a5a5a]"
        style={{ lineHeight: '1.5rem' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={highlight}
          readOnly={readOnly}
          padding={12}
          textareaClassName="code-editor-textarea"
          preClassName="code-editor-pre"
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 13,
            lineHeight: '1.5rem',
            minHeight: minHeight - 24,
            color: '#d4d4d4',
          }}
        />
      </div>
    </div>
  )
}

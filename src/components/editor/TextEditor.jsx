import React from 'react'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'
import IconButton from '../ui/IconButton'

export const FONT_FAMILIES = ['Inter', 'Georgia', 'Arial', 'Courier New', 'Times New Roman', 'JetBrains Mono']
export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48]

export default function TextEditorToolbar({ style, onChange }) {
  const patch = (p) => onChange({ ...style, ...p })

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
      <select
        aria-label="Font family"
        value={style.fontFamily}
        onChange={(e) => patch({ fontFamily: e.target.value })}
        className="h-7 rounded-md border border-gray-200 bg-white px-1.5 text-xs text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
        style={{ fontFamily: style.fontFamily }}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>

      <select
        aria-label="Font size"
        value={style.fontSize}
        onChange={(e) => patch({ fontSize: Number(e.target.value) })}
        className="h-7 w-14 rounded-md border border-gray-200 bg-white px-1.5 text-xs text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}px
          </option>
        ))}
      </select>

      <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600" />

      <IconButton icon={Bold} label="Bold" size="sm" active={style.bold} onClick={() => patch({ bold: !style.bold })} />
      <IconButton icon={Italic} label="Italic" size="sm" active={style.italic} onClick={() => patch({ italic: !style.italic })} />
      <IconButton icon={Underline} label="Underline" size="sm" active={style.underline} onClick={() => patch({ underline: !style.underline })} />

      <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600" />

      <IconButton icon={AlignLeft} label="Align left" size="sm" active={style.textAlign === 'left'} onClick={() => patch({ textAlign: 'left' })} />
      <IconButton icon={AlignCenter} label="Align center" size="sm" active={style.textAlign === 'center'} onClick={() => patch({ textAlign: 'center' })} />
      <IconButton icon={AlignRight} label="Align right" size="sm" active={style.textAlign === 'right'} onClick={() => patch({ textAlign: 'right' })} />
      <IconButton icon={AlignJustify} label="Justify" size="sm" active={style.textAlign === 'justify'} onClick={() => patch({ textAlign: 'justify' })} />

      <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600" />

      <label className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
        Text
        <input
          type="color"
          aria-label="Text color"
          value={style.color}
          onChange={(e) => patch({ color: e.target.value })}
          className="h-6 w-6 cursor-pointer rounded border border-gray-200 bg-transparent p-0 dark:border-gray-600"
        />
      </label>

      <label className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
        Fill
        <input
          type="color"
          aria-label="Background color"
          value={style.background === 'transparent' ? '#ffffff' : style.background}
          onChange={(e) => patch({ background: e.target.value })}
          className="h-6 w-6 cursor-pointer rounded border border-gray-200 bg-transparent p-0 dark:border-gray-600"
        />
      </label>
      {style.background !== 'transparent' && (
        <button
          onClick={() => patch({ background: 'transparent' })}
          className="rounded-md px-1.5 py-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          Clear fill
        </button>
      )}
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'

export const inputCls =
  'h-7 w-full min-w-0 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'

export function Section({ title, children, action }) {
  return (
    <section className="space-y-2 border-b border-gray-100 px-3 py-3 last:border-b-0 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}

export function TextField({ label, value, onChange, placeholder, ariaLabel, className = '', mono = false }) {
  const input = (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel || label}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} ${mono ? 'font-mono' : ''} ${className}`}
    />
  )
  return label ? <Field label={label}>{input}</Field> : input
}

/**
 * Numeric input that keeps the user's raw text while they type, so partial
 * entries like "-", "1." or "0.0" are never destroyed by round-tripping
 * through a number. A value is only committed once it parses as a finite number.
 */
export function NumField({ value, onChange, allowEmpty = false, ariaLabel, placeholder, className = '' }) {
  const asText = (v) => (v === null || v === undefined ? '' : String(v))
  const [text, setText] = useState(asText(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(asText(value))
  }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={() => {
        focused.current = true
      }}
      onBlur={() => {
        focused.current = false
        setText(asText(value))
      }}
      onChange={(e) => {
        const t = e.target.value
        setText(t)
        if (t.trim() === '') {
          if (allowEmpty) onChange(null)
          return
        }
        const n = Number(t)
        if (Number.isFinite(n)) onChange(n)
      }}
      className={`${inputCls} ${className}`}
    />
  )
}

export function ColorField({ value, onChange, ariaLabel }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#3366ff'
  return (
    <input
      type="color"
      value={safe}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-7 shrink-0 cursor-pointer rounded border border-gray-200 bg-transparent p-0 dark:border-gray-600"
    />
  )
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-gray-300 text-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
      />
      {label}
    </label>
  )
}

export function SelectField({ label, value, onChange, children, ariaLabel }) {
  const select = (
    <select value={value} aria-label={ariaLabel || label} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {children}
    </select>
  )
  return label ? <Field label={label}>{select}</Field> : select
}

/** Compact text button used inside tables (no tooltip layer, so it never clips in scroll areas). */
export function MiniButton({ children, onClick, label, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 ${
        danger
          ? 'text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

export function AddButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-gray-300 px-2.5 text-xs font-medium text-gray-500 transition-colors hover:border-accent-400 hover:text-accent-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-400"
    >
      + {children}
    </button>
  )
}

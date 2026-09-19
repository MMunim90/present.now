import React from 'react'
import Tooltip from './Tooltip'

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  size = 'md',
  tooltipSide = 'bottom',
  className = '',
  type = 'button',
}) {
  const sizeClasses = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const iconSize = size === 'sm' ? 14 : 16

  const button = (
    <button
      type={type}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex ${sizeClasses} shrink-0 items-center justify-center rounded-lg border transition-colors
        ${active
          ? 'border-accent-300 bg-accent-50 text-accent-600 dark:border-accent-700 dark:bg-accent-900/40 dark:text-accent-300'
          : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'}
        disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500
        ${className}`}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </button>
  )

  if (!label) return button
  return (
    <Tooltip label={label} side={tooltipSide}>
      {button}
    </Tooltip>
  )
}

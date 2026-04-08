import * as React from 'react'

export function Checkbox({
  checked,
  onCheckedChange,
  className = '',
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-4 w-4 rounded border-white/20 bg-white/5 ${className}`.trim()}
    />
  )
}


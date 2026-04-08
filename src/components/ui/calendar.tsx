'use client'

import { format } from 'date-fns'

export function Calendar({
  selected,
  onSelect,
  className = '',
}: {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
}) {
  return (
    <input
      type="date"
      value={selected ? format(selected, 'yyyy-MM-dd') : ''}
      onChange={(e) => {
        if (!e.target.value) return
        onSelect?.(new Date(`${e.target.value}T00:00:00`))
      }}
      className={`sb-input ${className}`.trim()}
    />
  )
}


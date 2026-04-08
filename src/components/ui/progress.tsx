import * as React from 'react'

export function Progress({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`.trim()}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}


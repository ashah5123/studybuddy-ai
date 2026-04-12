import * as React from 'react'

export function Badge({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)] ${className}`.trim()}
      {...props}
    />
  )
}

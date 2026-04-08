import * as React from 'react'

export function Card({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`sb-panel ${className}`.trim()} {...props} />
}


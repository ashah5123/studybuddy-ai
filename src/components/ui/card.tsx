import * as React from 'react'

export function Card({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`sb-panel sb-panel-hover ${className}`.trim()} {...props} />
}


import * as React from 'react'

export function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`sb-input ${className}`.trim()} {...props} />
}


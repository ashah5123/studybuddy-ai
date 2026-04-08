import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost'
}

export function Button({
  className = '',
  variant = 'default',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const style =
    variant === 'default'
      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110'
      : variant === 'secondary'
        ? 'border border-white/10 bg-white/5 text-[var(--foreground)] hover:bg-white/10'
        : 'text-[var(--sb-muted)] hover:bg-white/10 hover:text-[var(--foreground)]'
  return <button className={`${base} ${style} ${className}`.trim()} {...props} />
}


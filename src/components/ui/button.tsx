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
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:translate-y-[0.5px]'
  const style =
    variant === 'default'
      ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/20 hover:-translate-y-0.5 hover:brightness-110'
      : variant === 'secondary'
        ? 'border border-[var(--sb-border)] bg-[var(--sb-surface-2)] text-[var(--foreground)] hover:-translate-y-0.5 hover:border-[var(--sb-border-2)] hover:bg-[var(--sb-surface-3)]'
        : 'text-[var(--sb-muted)] hover:bg-[var(--sb-item-bg)] hover:text-[var(--foreground)]'
  return <button className={`${base} ${style} ${className}`.trim()} {...props} />
}

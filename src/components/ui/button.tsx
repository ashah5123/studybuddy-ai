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
      ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-violet-700/35'
      : variant === 'secondary'
        ? 'border border-white/10 bg-white/5 text-[var(--foreground)] hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/10'
        : 'text-[var(--sb-muted)] hover:bg-white/10 hover:text-[var(--foreground)] hover:-translate-y-0.5'
  return <button className={`${base} ${style} ${className}`.trim()} {...props} />
}


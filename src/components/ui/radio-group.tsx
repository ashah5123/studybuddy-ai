import * as React from 'react'

export function RadioGroup({
  value,
  onValueChange,
  children,
  className = '',
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div role="radiogroup" className={className} data-value={value}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child as React.ReactElement<{ checkedValue?: string; onChecked?: (value: string) => void }>, {
          checkedValue: value,
          onChecked: onValueChange,
        })
      })}
    </div>
  )
}

export function RadioGroupItem({
  value,
  checkedValue,
  onChecked,
  label,
  className = '',
}: {
  value: string
  checkedValue?: string
  onChecked?: (value: string) => void
  label: string
  className?: string
}) {
  const checked = checkedValue === value
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={() => onChecked?.(value)}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
        checked
          ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-100'
          : 'border-white/10 bg-white/5 text-[var(--foreground)]'
      } ${className}`.trim()}
    >
      <span className={`h-3.5 w-3.5 rounded-full border ${checked ? 'border-indigo-300 bg-indigo-300' : 'border-white/40'}`} />
      {label}
    </button>
  )
}


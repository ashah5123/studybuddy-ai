import * as React from 'react'

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onValueChange,
  className = '',
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`inline-flex rounded-xl border border-white/10 bg-white/5 p-1 ${className}`.trim()}
      {...props}
    />
  )
}

export function TabsTrigger({
  value,
  className = '',
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) return null
  const active = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active ? 'bg-white/15 text-[var(--foreground)]' : 'text-[var(--sb-muted)] hover:text-[var(--foreground)]'
      } ${className}`.trim()}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className = '',
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx || ctx.value !== value) return null
  return <div className={className}>{children}</div>
}


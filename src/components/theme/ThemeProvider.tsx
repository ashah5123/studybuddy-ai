'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'studybuddy_theme'

function setDomTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
} | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep initial render deterministic (dark) to avoid hydration mismatch.
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const t = getInitialTheme()
    setDomTheme(t)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync state to persisted client preference post-hydration
    setThemeState(t)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    window.localStorage.setItem(STORAGE_KEY, t)
    setDomTheme(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}


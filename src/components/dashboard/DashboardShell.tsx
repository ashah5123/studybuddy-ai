'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarRange,
  FileQuestion,
  FileText,
  Settings,
  LayoutDashboard,
  MessageSquare,
  Menu,
  StickyNote,
  X,
  Zap,
  LogOut,
  ChevronDown,
  User,
  Moon,
  Sun,
} from 'lucide-react'
import { signOut } from '@/lib/auth/actions'
import type { Profile } from '@/types/database.types'
import { ThemeContext } from '@/components/theme/ThemeProvider'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/courses', label: 'Courses', icon: BookOpen, exact: false },
  { href: '/dashboard/assignments', label: 'Assignments', icon: Calendar, exact: false },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, exact: false },
  { href: '/dashboard/study-planner', label: 'Study Planner', icon: CalendarRange, exact: false },
  { href: '/dashboard/quiz-generator', label: 'Quiz Generator', icon: FileQuestion, exact: false },
  { href: '/dashboard/ai-helper', label: 'AI Helper', icon: MessageSquare, exact: false },
  { href: '/dashboard/flashcards', label: 'Flashcards', icon: Zap, exact: false },
  { href: '/dashboard/notes', label: 'Notes', icon: StickyNote, exact: false },
  { href: '/dashboard/pdf-annotator', label: 'PDF Annotator', icon: FileText, exact: false },
  { href: '/dashboard/settings', label: 'Account', icon: Settings, exact: false },
]

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: (typeof NAV_LINKS)[0] & { onClick?: () => void }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-[rgba(99,102,241,0.16)] text-white ring-1 ring-[rgba(99,102,241,0.34)]'
          : 'text-[rgba(226,232,240,0.78)] hover:bg-white/6 hover:text-white'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[var(--sb-accent)]' : 'text-[rgba(148,163,184,0.85)]'}`} />
      {label}
    </Link>
  )
}

function ThemeToggle() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return null

  const isDark = ctx.theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={ctx.toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[rgba(226,232,240,0.9)] transition-colors hover:bg-white/[0.09]"
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  )
}

function UserMenu({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const themeCtx = useContext(ThemeContext)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-[rgba(226,232,240,0.92)] transition-colors hover:bg-white/[0.09]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate font-medium sm:block">
          {profile?.full_name ?? profile?.email ?? 'Account'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[rgba(148,163,184,0.85)]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-white/10 bg-[rgba(15,23,42,0.96)] py-1 shadow-xl ring-1 ring-white/5 backdrop-blur-md">
          <div className="border-b border-white/10 px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-white">{profile?.full_name}</p>
            <p className="truncate text-xs text-[rgba(148,163,184,0.85)]">{profile?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              router.push('/dashboard')
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[rgba(226,232,240,0.88)] transition-colors hover:bg-white/5"
          >
            <User className="h-4 w-4 text-[rgba(148,163,184,0.85)]" />
            Dashboard home
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              router.push('/dashboard/settings')
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[rgba(226,232,240,0.88)] transition-colors hover:bg-white/5"
          >
            <Settings className="h-4 w-4 text-[rgba(148,163,184,0.85)]" />
            Account settings
          </button>
          {themeCtx && (
            <button
              type="button"
              onClick={() => {
                themeCtx.toggleTheme()
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[rgba(226,232,240,0.88)] transition-colors hover:bg-white/5"
            >
              {themeCtx.theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[rgba(148,163,184,0.85)]" />
              ) : (
                <Moon className="h-4 w-4 text-[rgba(148,163,184,0.85)]" />
              )}
              {themeCtx.theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
          )}
          <div className="mt-0.5 border-t border-white/10 pt-0.5">
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                await signOut()
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface DashboardShellProps {
  profile: Profile | null
  children: React.ReactNode
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0f162d] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/10 bg-[#111a33] px-4 py-4 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-5 flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            📚
          </span>
          <span className="font-bold tracking-tight text-white">
            Study<span className="text-[var(--sb-accent)]">Buddy</span>
          </span>
        </Link>
        <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[rgba(148,163,184,0.85)]">
          Workspace
        </div>
        <nav className="space-y-1 overflow-y-auto pr-1">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0f162d] px-3 sm:px-4 lg:ml-[248px]">
        <button
          type="button"
          className="rounded-lg p-2 text-[rgba(226,232,240,0.9)] hover:bg-white/10 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="mr-2 flex items-center gap-2.5 sm:mr-4 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm">
            📚
          </span>
          <span className="hidden font-bold tracking-tight text-white sm:block">
            Study<span className="text-[var(--sb-accent)]">Buddy</span>
            <span className="text-[rgba(129,140,248,0.95)]"> AI</span>
          </span>
        </Link>

        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-white">Dashboard</p>
          <p className="text-xs text-[var(--sb-muted)]">Welcome back, keep the momentum going.</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu profile={profile} />
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#111a33] shadow-2xl shadow-black/30">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="font-bold text-white">
                Study<span className="text-[var(--sb-accent)]">Buddy</span>
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-[rgba(226,232,240,0.9)] hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:ml-[248px] lg:px-8 lg:py-8 text-[var(--foreground)]">{children}</main>
    </div>
  )
}

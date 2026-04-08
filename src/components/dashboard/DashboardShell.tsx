'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  CalendarDays,
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
} from 'lucide-react'
import { signOut } from '@/lib/auth/actions'
import type { Profile } from '@/types/database.types'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/courses', label: 'Courses', icon: BookOpen, exact: false },
  { href: '/dashboard/assignments', label: 'Assignments', icon: Calendar, exact: false },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, exact: false },
  { href: '/dashboard/ai', label: 'AI Helper', icon: MessageSquare, exact: false },
  { href: '/dashboard/flashcards', label: 'Flashcards', icon: Zap, exact: false },
  { href: '/dashboard/notes', label: 'Notes', icon: StickyNote, exact: false },
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
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-indigo-50 text-indigo-800 shadow-sm ring-1 ring-indigo-200/80'
          : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
      {label}
    </Link>
  )
}

function UserMenu({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
        className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-indigo-500/25">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate font-medium sm:block">
          {profile?.full_name ?? profile?.email ?? 'Account'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-slate-900">{profile?.full_name}</p>
            <p className="truncate text-xs text-slate-500">{profile?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              router.push('/dashboard')
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <User className="h-4 w-4 text-slate-400" />
            Dashboard home
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              router.push('/dashboard/settings')
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            Account settings
          </button>
          <div className="mt-0.5 border-t border-slate-100 pt-0.5">
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                await signOut()
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50/80">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-3 backdrop-blur-md sm:px-4">
        <button
          type="button"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="mr-2 flex items-center gap-2.5 sm:mr-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm shadow-md shadow-indigo-500/25">
            📚
          </span>
          <span className="hidden font-bold tracking-tight text-slate-900 sm:block">
            Study<span className="text-indigo-600">Buddy</span>
            <span className="text-violet-600"> AI</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="ml-auto">
          <UserMenu profile={profile} />
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-300/30">
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
              <span className="font-bold text-slate-900">
                Study<span className="text-indigo-600">Buddy</span>
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}

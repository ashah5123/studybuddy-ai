'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Calendar,
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
  { href: '/dashboard/ai', label: 'AI Helper', icon: MessageSquare, exact: false },
  { href: '/dashboard/flashcards', label: 'Flashcards', icon: Zap, exact: false },
  { href: '/dashboard/notes', label: 'Notes', icon: StickyNote, exact: false },
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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
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
    ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate font-medium">
          {profile?.full_name ?? profile?.email ?? 'Account'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); router.push('/dashboard') }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <User className="h-4 w-4" />
            Profile
          </button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={async () => { setOpen(false); await signOut() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
        <button
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 mr-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm">📚</span>
          <span className="font-bold text-gray-900 hidden sm:block">
            StudyBuddy<span className="text-blue-600"> AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="ml-auto">
          <UserMenu profile={profile} />
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
              <span className="font-bold text-gray-900">
                StudyBuddy<span className="text-blue-600"> AI</span>
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
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

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

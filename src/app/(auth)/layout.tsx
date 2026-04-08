import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'StudyBuddy AI – Sign in',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient gradient orbs */}
      <div
        className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: 'rgba(139, 92, 246, 0.22)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: 'rgba(99, 102, 241, 0.18)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'rgba(14, 165, 233, 0.12)' }}
        aria-hidden
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl shadow-lg shadow-black/30 ring-1 ring-white/10">
            📚
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
              Study smarter
            </p>
            <span className="mt-1 block text-xl font-bold tracking-tight text-[var(--foreground)]">
              StudyBuddy
              <span className="bg-gradient-to-r from-indigo-500 to-violet-400 bg-clip-text text-transparent">
                {' '}
                AI
              </span>
            </span>
          </div>
        </div>

        <div className="sb-panel w-full max-w-md p-8 sm:p-9">{children}</div>

        <p className="mt-8 text-center text-xs text-[var(--sb-muted)]">
          © {new Date().getFullYear()} StudyBuddy AI
        </p>
      </div>
    </div>
  )
}

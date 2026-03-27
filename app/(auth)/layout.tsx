import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-5 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">StudyBuddy</span>
        </Link>
      </div>

      <div className="w-full max-w-sm">{children}</div>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}

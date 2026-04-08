import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'StudyBuddy AI – Sign in',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
          <span className="text-2xl">📚</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">
          StudyBuddy<span className="text-blue-600"> AI</span>
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {children}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        © {new Date().getFullYear()} StudyBuddy AI. All rights reserved.
      </p>
    </div>
  )
}

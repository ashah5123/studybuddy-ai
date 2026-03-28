'use client'

import { useEffect } from 'react'

export default function SettingsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-red-500">
          <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Something went wrong</h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-5 max-w-xs">We couldn\&apos;t load this page. Please try again.</p>
      <button onClick={reset} className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
        Try again
      </button>
    </div>
  )
}

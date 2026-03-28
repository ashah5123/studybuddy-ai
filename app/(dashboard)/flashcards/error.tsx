'use client'

import { useEffect } from 'react'

export default function FlashcardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <p className="text-gray-500 dark:text-gray-400">Something went wrong loading flashcards.</p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

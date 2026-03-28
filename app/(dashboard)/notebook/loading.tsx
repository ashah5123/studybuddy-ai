export default function NotebookLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl" />

      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/3" />
              </div>
              <div className="h-8 w-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

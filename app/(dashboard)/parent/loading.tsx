export default function ParentLoading() {
  return (
    <div className="space-y-6 max-w-3xl animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-44 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center space-y-2">
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto" />
            <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700/50 rounded mx-auto" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700/50 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StudySetsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-700/50 rounded" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-16 bg-gray-100 dark:bg-gray-700/50 rounded-full" />
              <div className="h-6 w-16 bg-gray-100 dark:bg-gray-700/50 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

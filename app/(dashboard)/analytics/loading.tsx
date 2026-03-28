export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-48 bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-48 bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

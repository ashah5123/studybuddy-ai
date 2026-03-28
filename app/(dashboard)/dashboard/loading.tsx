export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity calendar skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-sm bg-gray-100 dark:bg-gray-700/50" />
            ))}
          </div>
        </div>

        {/* Subject breakdown skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3.5 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent questions skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
              </div>
              <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700/50 rounded flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

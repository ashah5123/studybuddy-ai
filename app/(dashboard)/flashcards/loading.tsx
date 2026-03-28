export default function FlashcardsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 w-52 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

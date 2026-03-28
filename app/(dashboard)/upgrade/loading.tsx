export default function UpgradeLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="h-8 w-52 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-700/50 rounded-full mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`bg-white dark:bg-gray-800 rounded-2xl border p-6 space-y-5 ${i === 1 ? 'border-indigo-300 dark:border-indigo-700' : 'border-gray-100 dark:border-gray-700'}`}>
            <div className="space-y-2">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-3 w-40 bg-gray-100 dark:bg-gray-700/50 rounded" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded" />
              ))}
            </div>
            <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

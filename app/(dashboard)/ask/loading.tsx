export default function AskLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          ))}
        </div>
        <div className="h-32 bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/shared/skeletons/Skeleton'

export function AnalysisLoadingSkeleton() {
  return (
    <div
      className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-pulse"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-2">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

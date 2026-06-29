import { Skeleton } from '@/components/shared/skeletons/Skeleton'

export function AuthLoadingSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-md space-y-4 animate-pulse"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Top accent bar */}
      <Skeleton className="h-1.5 w-full rounded-t-xl" />

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm">
        <div className="space-y-2 p-6 pb-2">
          {/* Title */}
          <Skeleton className="h-7 w-32 rounded-lg" />
          {/* Subtitle */}
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>

        <div className="p-6 pt-2 space-y-5">
          {/* Email field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Submit button */}
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Footer link */}
      <div className="flex justify-center">
        <Skeleton className="h-4 w-40 rounded-lg" />
      </div>
    </div>
  )
}

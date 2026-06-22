import { Skeleton } from '@/components/shared/skeletons/Skeleton'

export default function NayanAILoading() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <Skeleton className="h-60 w-full rounded-2xl" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function NayanAiProcessingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 flex items-center gap-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          ))}
        </div>
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      <Skeleton className="h-60 w-full rounded-2xl" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/shared/skeletons/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <Skeleton className="h-4 w-36 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-8 w-16 mx-auto rounded-lg" />
              <Skeleton className="h-3 w-20 mx-auto rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <Skeleton className="h-4 w-32 rounded-lg" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

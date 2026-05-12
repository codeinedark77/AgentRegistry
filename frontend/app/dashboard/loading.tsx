import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AgentCardSkeleton, StatCardSkeleton } from '@/components/ui/SkeletonCard'

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="shimmer-bg h-8 w-52 rounded-xl" />
            <div className="shimmer-bg h-3 w-72 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="shimmer-bg h-8 w-24 rounded-xl" />
            <div className="shimmer-bg h-8 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="shimmer-bg h-14 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />)}
        </div>
      </div>
    </DashboardLayout>
  )
}
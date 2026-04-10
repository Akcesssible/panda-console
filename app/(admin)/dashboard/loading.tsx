import { SkeletonHeader } from '@/components/ui/Skeleton'

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="space-y-3 max-w-[1400px]">
      {/* Header */}
      <SkeletonHeader />

      {/* Top row — 3 equal columns */}
      <div className="grid grid-cols-3 gap-3">
        {/* EarningTrendCard */}
        <div className="bg-white rounded-3xl p-5 flex flex-col gap-4">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-40 w-full" />
          <div className="flex justify-between">
            {[1,2,3,4,5,6,7].map(i => <Pulse key={i} className="h-3 w-6" />)}
          </div>
        </div>
        {/* ActiveDriversCluster */}
        <div className="bg-white rounded-3xl p-5 flex flex-col gap-4">
          <Pulse className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-3 flex-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-[#ECEEF3] rounded-2xl p-4 flex flex-col gap-3">
                <Pulse className="h-3 w-20" />
                <Pulse className="h-7 w-16" />
              </div>
            ))}
          </div>
        </div>
        {/* ChurnRateCard */}
        <div className="bg-white rounded-3xl p-5 flex flex-col gap-4">
          <Pulse className="h-4 w-28" />
          <Pulse className="h-32 w-32 !rounded-full mx-auto" />
          <div className="space-y-2">
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Alert cards */}
        <div className="flex flex-col gap-3">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-3xl p-5 flex flex-col gap-3">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-10 w-20" />
              <Pulse className="h-3 w-36" />
              <Pulse className="h-9 w-32 !rounded-full" />
            </div>
          ))}
        </div>
        {/* Recent activity */}
        <div className="col-span-2 bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <Pulse className="h-5 w-36" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-4 px-6 py-3.5 border-b border-gray-50 ${i % 2 === 1 ? 'bg-[#F5F7FF]' : ''}`}>
              <Pulse className="w-8 h-8 !rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Pulse className="h-3.5 w-64" />
                <Pulse className="h-3 w-40" />
              </div>
              <Pulse className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

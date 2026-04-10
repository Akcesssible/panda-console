function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function ReportsLoading() {
  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-9 w-32" />
          <Pulse className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Pulse className="h-9 w-36 !rounded-full" />
          <Pulse className="h-9 w-28 !rounded-full" />
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-3xl p-4 grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-[#ECEEF3] rounded-2xl px-4 py-4 flex flex-col gap-6">
            <Pulse className="h-4 w-28" />
            <div className="space-y-2">
              <Pulse className="h-8 w-32" />
              <Pulse className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 flex flex-col gap-4">
            <Pulse className="h-5 w-36" />
            <Pulse className="h-48 w-full" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Pulse className="h-5 w-36" />
          <Pulse className="h-9 w-32 !rounded-full" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-6 px-6 py-3.5 border-b border-gray-50 ${i % 2 === 1 ? 'bg-[#F5F7FF]' : ''}`}>
            <Pulse className="h-3.5 w-24" />
            <Pulse className="h-3.5 w-32 flex-1" />
            <Pulse className="h-3.5 w-20" />
            <Pulse className="h-3.5 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

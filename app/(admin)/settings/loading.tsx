function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function SettingsLoading() {
  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-9 w-32" />
          <Pulse className="h-4 w-48" />
        </div>
        {/* Settings tab pills */}
        <div className="flex gap-1.5 bg-[#DADFE5] rounded-full p-1">
          {[1,2,3,4,5].map(i => (
            <Pulse key={i} className="h-9 w-24 !rounded-full" />
          ))}
        </div>
      </div>

      {/* Settings content area */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left — user list or config form */}
        <div className="col-span-2 bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <Pulse className="h-5 w-32" />
            <Pulse className="h-9 w-32 !rounded-full" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 ${i % 2 === 1 ? 'bg-[#F5F7FF]' : ''}`}>
              <Pulse className="h-10 w-10 !rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Pulse className="h-4 w-40" />
                <Pulse className="h-3 w-28" />
              </div>
              <Pulse className="h-6 w-24 !rounded-full" />
              <Pulse className="h-6 w-20 !rounded-full" />
            </div>
          ))}
        </div>

        {/* Right — invite / config panel */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <Pulse className="h-5 w-28" />
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="space-y-1.5">
                <Pulse className="h-3.5 w-20" />
                <Pulse className="h-10 w-full !rounded-lg" />
              </div>
            ))}
          </div>
          <Pulse className="h-10 w-full !rounded-full mt-2" />
        </div>
      </div>
    </div>
  )
}

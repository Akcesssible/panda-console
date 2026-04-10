function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function DriverDetailLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Pulse className="h-4 w-16" />
        <Pulse className="h-4 w-4 !rounded-full" />
        <Pulse className="h-4 w-32" />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <Pulse className="h-8 w-48" />
        <div className="flex gap-2">
          <Pulse className="h-9 w-24 !rounded-full" />
          <Pulse className="h-9 w-24 !rounded-full" />
          <Pulse className="h-9 w-24 !rounded-full" />
        </div>
      </div>

      {/* Stats row */}
      <div className="bg-white rounded-3xl p-4 grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-[#ECEEF3] rounded-2xl px-4 py-4 flex flex-col gap-6">
            <Pulse className="h-4 w-28" />
            <div className="space-y-2">
              <Pulse className="h-8 w-20" />
              <Pulse className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Profile + vehicle grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4">
          <Pulse className="h-24 w-24 !rounded-full mx-auto" />
          <Pulse className="h-5 w-36 mx-auto" />
          <Pulse className="h-4 w-24 mx-auto" />
          <div className="space-y-3 mt-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex justify-between">
                <Pulse className="h-3.5 w-20" />
                <Pulse className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* Right side — subscription + gallery */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Subscription card */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <Pulse className="h-5 w-40" />
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-[#ECEEF3] rounded-xl p-3 flex flex-col gap-2">
                  <Pulse className="h-3 w-20" />
                  <Pulse className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle gallery */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <Pulse className="h-5 w-32" />
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(i => (
                <Pulse key={i} className="h-28 w-full !rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ride history table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Pulse className="h-5 w-32" />
          <Pulse className="h-9 w-44" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-6 px-6 py-3.5 border-b border-gray-50 ${i % 2 === 1 ? 'bg-[#F5F7FF]' : ''}`}>
            <Pulse className="h-3.5 w-24" />
            <Pulse className="h-3.5 w-32 flex-1" />
            <Pulse className="h-6 w-20 !rounded-full" />
            <Pulse className="h-3.5 w-20" />
            <Pulse className="h-3.5 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

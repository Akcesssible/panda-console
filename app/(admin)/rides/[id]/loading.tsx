function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function RideDetailLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-4 !rounded-full" />
        <Pulse className="h-4 w-24" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-8 w-40" />
          <div className="flex gap-2">
            <Pulse className="h-6 w-20 !rounded-full" />
            <Pulse className="h-6 w-16 !rounded-full" />
          </div>
        </div>
        <Pulse className="h-9 w-28 !rounded-full" />
      </div>

      {/* Stats row */}
      <div className="bg-white rounded-3xl p-4 grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-[#ECEEF3] rounded-2xl px-4 py-4 flex flex-col gap-4">
            <Pulse className="h-3.5 w-24" />
            <Pulse className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Driver info */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <Pulse className="h-5 w-28" />
          <div className="flex items-center gap-3">
            <Pulse className="h-12 w-12 !rounded-full" />
            <div className="space-y-2">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex justify-between">
                <Pulse className="h-3.5 w-20" />
                <Pulse className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* Rider info */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <Pulse className="h-5 w-24" />
          <div className="flex items-center gap-3">
            <Pulse className="h-12 w-12 !rounded-full" />
            <div className="space-y-2">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex justify-between">
                <Pulse className="h-3.5 w-20" />
                <Pulse className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
        <Pulse className="h-5 w-24" />
        <div className="flex items-center justify-between">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Pulse className="h-8 w-8 !rounded-full" />
              <Pulse className="h-3.5 w-16" />
              <Pulse className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Route */}
      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <Pulse className="h-5 w-20" />
        <Pulse className="h-48 w-full !rounded-xl" />
      </div>
    </div>
  )
}

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function TicketDetailLoading() {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Pulse className="h-4 w-16" />
        <Pulse className="h-4 w-4 !rounded-full" />
        <Pulse className="h-4 w-40" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-72" />
          <div className="flex gap-2">
            <Pulse className="h-6 w-24 !rounded-full" />
            <Pulse className="h-6 w-28 !rounded-full" />
          </div>
        </div>
        <Pulse className="h-4 w-32" />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Conversation — takes 2 cols */}
        <div className="col-span-2 bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <Pulse className="h-5 w-32" />
          </div>
          <div className="flex flex-col gap-4 p-5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <Pulse className="h-9 w-9 !rounded-full shrink-0" />
                <div className={`space-y-1.5 max-w-xs ${i % 2 === 0 ? 'items-end flex flex-col' : ''}`}>
                  <Pulse className="h-3 w-24" />
                  <Pulse className={`h-16 ${i % 2 === 0 ? 'w-52' : 'w-64'} !rounded-2xl`} />
                </div>
              </div>
            ))}
          </div>
          {/* Reply box */}
          <div className="border-t border-gray-100 p-4 flex gap-3">
            <Pulse className="flex-1 h-10" />
            <Pulse className="h-10 w-20 !rounded-full" />
          </div>
        </div>

        {/* Sidebar — actions + info */}
        <div className="flex flex-col gap-4">
          {/* Actions */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <Pulse className="h-5 w-24" />
            <Pulse className="h-9 w-full !rounded-full" />
            <Pulse className="h-9 w-full !rounded-full" />
            <Pulse className="h-px w-full !rounded-none" />
            <Pulse className="h-9 w-full !rounded-full" />
          </div>

          {/* Ticket info */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <Pulse className="h-5 w-28" />
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex justify-between">
                <Pulse className="h-3.5 w-20" />
                <Pulse className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

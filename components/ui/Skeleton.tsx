// Reusable skeleton blocks — compose these in loading.tsx files.
// All blocks use the same pulse animation so the whole page feels in sync.

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

/** Simulates the PageHeader title + subtitle */
export function SkeletonHeader({ tabs = 0 }: { tabs?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Pulse className="h-9 w-56" />
        <Pulse className="h-4 w-40" />
      </div>
      {tabs > 0 && (
        <div className="flex gap-1.5 bg-[#DADFE5] rounded-full p-1">
          {Array.from({ length: tabs }).map((_, i) => (
            <Pulse key={i} className="h-9 w-24 !rounded-full" />
          ))}
        </div>
      )}
    </div>
  )
}

/** Simulates the StatsRow with N cards */
export function SkeletonStatsRow({ cards = 4 }: { cards?: number }) {
  return (
    <div
      className="bg-white rounded-3xl p-4 grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cards}, 1fr)` }}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-[#ECEEF3] rounded-2xl px-4 py-4 flex flex-col gap-6">
          <Pulse className="h-4 w-28" />
          <div className="space-y-2">
            <Pulse className="h-8 w-36" />
            <Pulse className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Simulates a DataTable card with N skeleton rows */
export function SkeletonTable({ rows = 7 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Pulse className="h-5 w-36" />
        <div className="flex gap-2">
          <Pulse className="h-9 w-52" />
          <Pulse className="h-9 w-20" />
        </div>
      </div>
      {/* Column headings */}
      <div className="flex gap-6 px-6 py-3 border-b border-gray-100">
        {[32, 28, 20, 16, 16, 20].map((w, i) => (
          <Pulse key={i} className={`h-4 w-${w}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-6 px-6 py-3.5 border-b border-gray-50 ${i % 2 === 1 ? 'bg-[#F5F7FF]' : ''}`}
        >
          <div className="flex items-center gap-3 w-32 shrink-0">
            <Pulse className="w-9 h-9 !rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Pulse className="h-3.5 w-full" />
              <Pulse className="h-3 w-3/4" />
            </div>
          </div>
          <Pulse className="h-3.5 w-24" />
          <Pulse className="h-3.5 w-16" />
          <Pulse className="h-6 w-16 !rounded-full" />
          <Pulse className="h-3.5 w-20" />
          <Pulse className="h-3.5 w-20 ml-auto" />
        </div>
      ))}
      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <Pulse className="h-4 w-28" />
        <Pulse className="h-8 w-48" />
        <Pulse className="h-8 w-32" />
      </div>
    </div>
  )
}

/** Full standard page skeleton: header + stats + table */
export function SkeletonStandardPage({ tabs = 0, statCards = 4, tableRows = 7 }: {
  tabs?: number
  statCards?: number
  tableRows?: number
}) {
  return (
    <div className="space-y-4 w-full">
      <SkeletonHeader tabs={tabs} />
      <SkeletonStatsRow cards={statCards} />
      <SkeletonTable rows={tableRows} />
    </div>
  )
}

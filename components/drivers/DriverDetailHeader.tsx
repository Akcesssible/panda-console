import { DriverStatusBadge } from '@/components/ui/Badge'
import { formatDate, timeAgo } from '@/lib/utils'
import type { Driver, AdminRole } from '@/lib/types'
import Link from 'next/link'

export function DriverDetailHeader({ driver, adminRole }: { driver: Driver; adminRole: AdminRole }) {
  const completionRate = driver.total_trips > 0
    ? Math.round((driver.completed_trips / driver.total_trips) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/drivers" className="hover:text-gray-900">Drivers</Link>
        <span>/</span>
        <span className="text-gray-900">{driver.full_name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{driver.full_name}</h1>
            <DriverStatusBadge status={driver.status} />
            <span className="text-gray-500">⭐ {driver.rating?.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{driver.driver_number}</span>
            <span>•</span>
            <span>{(driver.zones as { name: string } | null)?.name ?? '—'}</span>
            <span>•</span>
            <span>{driver.phone}</span>
            <span>•</span>
            <span>Joined {formatDate(driver.joined_at)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Last active {timeAgo(driver.last_active_at ?? undefined)}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-center shrink-0">
          <div>
            <p className="text-xl font-bold text-gray-900">{driver.total_trips.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Trips</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-xs text-gray-500">Completion</p>
          </div>
        </div>
      </div>
    </div>
  )
}

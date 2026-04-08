import Link from 'next/link'

interface AlertsPanelProps {
  pendingDrivers: number
  expiredSubs: number
  openTickets: number
}

export function AlertsPanel({ pendingDrivers, expiredSubs, openTickets }: AlertsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Alerts</h2>
      <div className="space-y-3">
        <AlertItem
          label="Drivers Pending Approval"
          count={pendingDrivers}
          href="/drivers?tab=pending"
          ctaLabel="Verify Drivers"
          variant="yellow"
        />
        <AlertItem
          label="Expired Subscriptions"
          count={expiredSubs}
          href="/subscriptions?tab=expired"
          ctaLabel="Notify Drivers"
          variant="red"
        />
        <AlertItem
          label="Open Disputes"
          count={openTickets}
          href="/support?tab=open"
          ctaLabel="View Tickets"
          variant="orange"
        />
      </div>
    </div>
  )
}

function AlertItem({
  label, count, href, ctaLabel, variant,
}: {
  label: string; count: number; href: string; ctaLabel: string; variant: 'yellow' | 'red' | 'orange'
}) {
  const styles = {
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
  }
  const countStyles = {
    yellow: 'text-yellow-700',
    red: 'text-red-700',
    orange: 'text-orange-700',
  }

  return (
    <div className={`rounded-lg border p-3 ${styles[variant]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-lg font-bold ${countStyles[variant]}`}>{count} Drivers</p>
          <p className="text-xs text-gray-600 mt-0.5">{label}</p>
        </div>
        <Link
          href={href}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap mt-1"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

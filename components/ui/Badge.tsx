type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange' | 'purple'

const VARIANTS: Record<BadgeVariant, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  blue: 'bg-primary-50$ text-primary$ border-primary-200$',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}

// Dot + label style (matches table design)
function DotBadge({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-sm text-[#1d242d]">{label}</span>
    </span>
  )
}

// Domain-specific badge helpers
export function DriverStatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    active:    { dot: 'bg-green-500',  label: 'Active' },
    pending:   { dot: 'bg-yellow-400', label: 'Pending' },
    suspended: { dot: 'bg-red-500',    label: 'Suspended' },
    churned:   { dot: 'bg-orange-400', label: 'Churned' },
  }
  const m = map[status] ?? { dot: 'bg-gray-400', label: status }
  return <DotBadge dot={m.dot} label={m.label} />
}

export function RideStatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    requested: { dot: 'bg-yellow-400', label: 'Requested' },
    accepted:  { dot: 'bg-blue-400',   label: 'Accepted' },
    ongoing:   { dot: 'bg-[#2B39C7]',  label: 'Ongoing' },
    completed: { dot: 'bg-green-500',  label: 'Completed' },
    cancelled: { dot: 'bg-red-500',    label: 'Cancelled' },
  }
  const m = map[status] ?? { dot: 'bg-gray-400', label: status }
  return <DotBadge dot={m.dot} label={m.label} />
}

export function SubscriptionBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    active: 'green', expired: 'red', cancelled: 'gray', grace_period: 'orange',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status.replace('_', ' ')}</Badge>
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    completed: 'green', pending: 'yellow', failed: 'red',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

export function TicketStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'gray',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status.replace('_', ' ')}</Badge>
}

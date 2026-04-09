export type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange' | 'purple'

const VARIANTS: Record<BadgeVariant, string> = {
  green:  'bg-green-50   text-green-600  border border-green-300',
  red:    'bg-red-50     text-red-500    border border-red-300',
  yellow: 'bg-yellow-50  text-yellow-600 border border-yellow-300',
  blue:   'bg-blue-50    text-blue-600   border border-blue-300',
  gray:   'bg-gray-100   text-gray-500   border border-gray-300',
  orange: 'bg-orange-50  text-orange-600 border border-orange-300',
  purple: 'bg-purple-50  text-purple-600 border border-purple-300',
}

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-normal ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}

// Domain-specific badge helpers
export function DriverStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active:    { variant: 'green',  label: 'active' },
    pending:   { variant: 'yellow', label: 'pending' },
    suspended: { variant: 'red',    label: 'suspended' },
    churned:   { variant: 'orange', label: 'churned' },
  }
  const m = map[status] ?? { variant: 'gray' as BadgeVariant, label: status }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function RideStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    requested: { variant: 'yellow', label: 'requested' },
    accepted:  { variant: 'blue',   label: 'accepted' },
    ongoing:   { variant: 'blue',   label: 'ongoing' },
    completed: { variant: 'green',  label: 'completed' },
    cancelled: { variant: 'red',    label: 'cancelled' },
  }
  const m = map[status] ?? { variant: 'gray' as BadgeVariant, label: status }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function SubscriptionBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    active: 'green', expired: 'red', cancelled: 'gray', grace_period: 'orange',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status.replace('_', ' ')}</Badge>
}

export function RiderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active:   { variant: 'green',  label: 'active' },
    inactive: { variant: 'gray',   label: 'inactive' },
    banned:   { variant: 'red',    label: 'banned' },
  }
  const m = map[status] ?? { variant: 'gray' as BadgeVariant, label: status }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    completed: 'green', pending: 'yellow', failed: 'red',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

export function TicketStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'gray',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status.replace('_', ' ')}</Badge>
}

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange' | 'purple'

const VARIANTS: Record<BadgeVariant, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
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

// Domain-specific badge helpers
export function DriverStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    active: 'green', pending: 'yellow', suspended: 'red', churned: 'gray',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

export function RideStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    requested: 'yellow', accepted: 'blue', ongoing: 'blue',
    completed: 'green', cancelled: 'red',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
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

import { format, formatDistanceToNow } from 'date-fns'

export function formatTZS(amount: number): string {
  return `TZS ${Math.round(amount).toLocaleString()}`
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return format(new Date(dateString), 'd MMM yyyy')
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return format(new Date(dateString), 'd MMM yyyy, h:mm a')
}

export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

// Generate sequential IDs
export function generateDriverNumber(count: number): string {
  return `DRV-${String(count).padStart(6, '0')}`
}

export function generateRideNumber(count: number): string {
  return `R-${String(count).padStart(5, '0')}`
}

export function generateTicketNumber(count: number): string {
  return `TKT-${String(count).padStart(5, '0')}`
}

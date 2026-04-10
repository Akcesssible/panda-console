import { createAdminClient } from '@/lib/supabase/server'
import type { SupportTicket, TicketMessage } from '@/lib/types'

const PER_PAGE = 20

export async function getTickets(params: {
  status?: string | string[]
  type?: string
  assignedTo?: string
  page?: number
  search?: string
}) {
  const supabase = createAdminClient()
  const { status, type, assignedTo, page = 1, search } = params
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      drivers(id, full_name, phone, driver_number),
      rides(id, ride_number, total_fare_tzs, status),
      admin_users!assigned_to(id, full_name, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) {
    if (Array.isArray(status)) query = query.in('status', status)
    else query = query.eq('status', status)
  }
  if (type) query = query.eq('type', type)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  if (search) query = query.or(`ticket_number.ilike.%${search}%,subject.ilike.%${search}%,reported_by.ilike.%${search}%`)

  const { data, count, error } = await query
  if (error) throw error
  return { tickets: (data ?? []) as SupportTicket[], total: count ?? 0 }
}

export async function getTicketById(id: string) {
  const supabase = createAdminClient()

  const [ticketResult, messagesResult] = await Promise.all([
    supabase
      .from('support_tickets')
      .select(`
        *,
        drivers(id, full_name, phone, driver_number),
        rides(id, ride_number, pickup_address, destination_address, total_fare_tzs, driver_earnings_tzs, status),
        admin_users!assigned_to(id, full_name, email)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (ticketResult.error) throw ticketResult.error
  return {
    ticket: ticketResult.data as SupportTicket,
    messages: (messagesResult.data ?? []) as TicketMessage[],
  }
}

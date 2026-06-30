import type { SupportTicket, TicketMessage } from '@/lib/types'

export async function getTickets(_params: {
  status?: string | string[]
  type?: string
  assignedTo?: string
  page?: number
  search?: string
}): Promise<{ tickets: SupportTicket[]; total: number }> {
  return { tickets: [], total: 0 }
}

export async function getTicketById(_id: string): Promise<{
  ticket: SupportTicket
  messages: TicketMessage[]
}> {
  throw new Error('Support ticket backend not yet implemented')
}

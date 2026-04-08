'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import type { TicketMessage, AdminUser } from '@/lib/types'

export function TicketConversation({
  messages, ticketId, adminUser,
}: {
  messages: TicketMessage[]
  ticketId: string
  adminUser: AdminUser
}) {
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  async function sendMessage() {
    if (!note.trim()) return
    setSending(true)
    await fetch(`/api/support/tickets/${ticketId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: note, sender_type: 'admin' }),
    })
    setNote('')
    setSending(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Conversation Log</h2>
      </div>

      {/* Messages */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No messages yet</p>
        ) : messages.map(msg => (
          <div key={msg.id} className={`px-5 py-3 ${msg.sender_type === 'admin' ? 'bg-blue-50/30' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">{msg.sender_name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                msg.sender_type === 'admin' ? 'bg-blue-100 text-blue-600' :
                msg.sender_type === 'system' ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-600'
              }`}>
                {msg.sender_type}
              </span>
            </div>
            <p className="text-sm text-gray-700">{msg.message}</p>
            <p className="text-xs text-gray-400 mt-1">{formatDateTime(msg.created_at)}</p>
          </div>
        ))}
      </div>

      {/* Add note */}
      <div className="px-5 py-4 border-t border-gray-200">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Add an admin note..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            disabled={!note.trim() || sending}
            onClick={sendMessage}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Note'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { canAccess } from '@/lib/types'

// Audit log read endpoint — no backend read API yet, return empty list
export async function GET() {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canAccess(adminUser.role, 'audit_logs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ logs: [], total: 0 })
}

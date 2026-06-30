import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { JWT_COOKIE } from '@/lib/api/jwt'

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8000'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const token = (await cookies()).get(JWT_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const upstream = await fetch(
    `${BACKEND_API_URL}/api/v1/drivers/admin/drivers/documents/${id}/file`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: '*/*',
      },
      cache: 'no-store',
    },
  )

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Document unavailable' }, { status: upstream.status || 502 })
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  })
}

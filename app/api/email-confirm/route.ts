import { NextResponse } from 'next/server'

// Records an email delivery confirmation click and redirects to the success page.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') ?? 'unknown'

  const timestamp = new Date().toISOString()
  console.log(`[email-confirm] ✅ Delivery confirmed — token: ${token}, at: ${timestamp}`)

  return NextResponse.redirect(
    new URL(`/email-confirm?token=${encodeURIComponent(token)}&confirmed=1`, request.url),
  )
}

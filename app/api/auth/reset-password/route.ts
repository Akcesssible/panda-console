import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/email/resend'
import { resetPasswordEmailHtml, resetPasswordEmailText } from '@/lib/email/templates/reset-password'
import { env } from '@/lib/env'

const APP_URL = env.NEXT_PUBLIC_APP_URL

const Schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const { email } = parsed.data
  const supabase = createAdminClient()

  // Verify the email belongs to an active admin user before sending a reset link.
  // We return the same success response either way to avoid user enumeration.
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('full_name, is_active')
    .eq('email', email)
    .single()

  if (adminUser?.is_active) {
    // Generate a password recovery link via Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${APP_URL}/reset-password` },
    })

    if (!linkError && linkData?.properties?.action_link) {
      const { error: emailError } = await resend.emails.send({
        from: 'Panda Console <noreply@pandahailing.com>',
        to: email,
        subject: 'Reset your Panda Console password',
        html: resetPasswordEmailHtml({
          full_name: adminUser.full_name,
          reset_url: linkData.properties.action_link,
          app_url: APP_URL,
        }),
        text: resetPasswordEmailText({
          full_name: adminUser.full_name,
          reset_url: linkData.properties.action_link,
          app_url: APP_URL,
        }),
      })

      if (emailError) {
        console.error('[reset-password] Email send failed:', emailError)
      }
    } else if (linkError) {
      console.error('[reset-password] Link generation failed:', linkError.message)
    }
  }

  // Always return success — never reveal whether the email exists
  return NextResponse.json({ ok: true })
}

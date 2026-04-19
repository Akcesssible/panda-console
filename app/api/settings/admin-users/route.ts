import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, InviteAdminUserSchema } from '@/lib/validations'
import { resend } from '@/lib/email/resend'
import { inviteEmailHtml, inviteEmailText } from '@/lib/email/templates/invite'
import { env } from '@/lib/env'

const APP_URL = env.NEXT_PUBLIC_APP_URL

// Generates a readable temporary password: e.g. "Kx7P-m3Qr-N8wZ"
// Avoids ambiguous chars (0/O, 1/l/I) so it's easy to read from an email.
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${segment(4)}-${segment(4)}-${segment(4)}`
}

export async function GET() {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('admin_users').select('*').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, InviteAdminUserSchema)
  if (body instanceof NextResponse) return body

  const { email, full_name, role } = body
  const supabase = createAdminClient()

  // Step 1 — generate a temporary password
  const tempPassword = generateTempPassword()

  // Step 2 — create the auth user with the temp password (email already confirmed)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,           // no email verification step needed
    user_metadata: { full_name, role },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const emailPayload = {
    full_name,
    email,
    role,
    temp_password: tempPassword,
    invited_by: adminUser.full_name,
    app_url: APP_URL,
  }

  // Step 3 — DB insert + email send in parallel
  const [{ data: user, error: userError }, { error: emailError }] = await Promise.all([
    supabase
      .from('admin_users')
      .insert({ full_name, email, role, auth_id: authData.user.id, status: 'invited', is_active: true })
      .select()
      .single(),
    resend.emails.send({
      from: 'Panda Console <noreply@pandahailing.com>',
      to: email,
      subject: `Your Panda Console account is ready`,
      html: inviteEmailHtml(emailPayload),
      text: inviteEmailText(emailPayload),
    }),
  ])

  if (userError) {
    // Roll back: delete the auth user so there's no orphan
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (emailError) {
    console.error('[create-user] Email send failed:', emailError)
  }

  // Step 4 — audit log (fire and forget)
  logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ADMIN_CREATE, entityType: 'admin_user', entityId: user.id,
    newValue: { email, full_name, role }, request,
  }).catch(err => console.error('[create-user] Audit log failed:', err))

  return NextResponse.json({ user, email_sent: !emailError })
}

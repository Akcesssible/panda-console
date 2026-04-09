import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, InviteAdminUserSchema } from '@/lib/validations'
import { resend } from '@/lib/email/resend'
import { inviteEmailHtml, inviteEmailText } from '@/lib/email/templates/invite'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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

  // Generate a Supabase invite link (does NOT send any email — we send our own)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${APP_URL}/set-password`,
      data: { full_name, role },
    },
  })

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })

  const inviteUrl = linkData.properties.action_link

  // Create admin_users record BEFORE sending email
  const { data: user, error: userError } = await supabase
    .from('admin_users')
    .insert({ full_name, email, role, auth_id: linkData.user.id })
    .select()
    .single()

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  // Send branded invitation email via Resend
  const emailPayload = {
    full_name,
    email,
    role,
    invite_url: inviteUrl,
    invited_by: adminUser.full_name,
    app_url: APP_URL,
  }

  const { error: emailError } = await resend.emails.send({
    from: 'Panda Console <noreply@pandahailing.com>',
    to: email,
    subject: `You've been invited to Panda Console`,
    html: inviteEmailHtml(emailPayload),
    text: inviteEmailText(emailPayload),
  })

  if (emailError) {
    // Log the error but don't fail — user is created, admin can resend manually
    console.error('[invite] Email send failed:', emailError)
  }

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ADMIN_CREATE, entityType: 'admin_user', entityId: user.id,
    newValue: { email, full_name, role }, request,
  })

  return NextResponse.json({ user, email_sent: !emailError })
}

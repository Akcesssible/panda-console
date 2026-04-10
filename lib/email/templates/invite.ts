const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  ops_admin: 'Operations Admin',
  support_agent: 'Support Agent',
  finance_viewer: 'Finance Viewer',
}

interface InviteEmailProps {
  full_name: string
  email: string
  role: string
  invite_url: string
  invited_by: string
  app_url: string
}

export function inviteEmailHtml({
  full_name,
  role,
  invite_url,
  invited_by,
  app_url,
}: InviteEmailProps): string {
  const roleLabel = ROLE_LABELS[role] ?? role
  const firstName = full_name.split(' ')[0]
  const logoUrl = `${app_url}/panda-logo.svg`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to Panda Console</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${logoUrl}" alt="Panda Console" width="130" height="auto"
                style="display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:48px 40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d242d;line-height:1.3;">
                Hi ${firstName}, you're invited! 👋
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#1d242d;">${invited_by}</strong> has invited you to join
                <strong style="color:#1d242d;">Panda Console</strong> — the internal back-office
                platform for Panda Hailing Tanzania.
              </p>

              <!-- Role pill -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#EEF0FD;border:1px solid rgba(43,57,199,0.25);border-radius:999px;padding:6px 16px;">
                    <span style="font-size:13px;font-weight:600;color:#2B39C7;">
                      Your role: ${roleLabel}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 32px;" />

              <!-- Instructions -->
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1d242d;">
                What to do next
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Click the button below to set your password and activate your account.
                This link expires in <strong style="color:#1d242d;">24 hours</strong>.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${invite_url}"
                      style="display:inline-block;background:#2B39C7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:14px;letter-spacing:0.01em;">
                      Set My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                Button not working? Copy and paste this link into your browser:<br />
                <a href="${invite_url}" style="color:#2B39C7;word-break:break-all;">${invite_url}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;" align="center">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Panda Hailing · Tanzania 🇹🇿<br />
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function inviteEmailText({
  full_name,
  role,
  invite_url,
  invited_by,
}: InviteEmailProps): string {
  const roleLabel = ROLE_LABELS[role] ?? role
  return `Hi ${full_name},

${invited_by} has invited you to join Panda Console as ${roleLabel}.

Set your password here (link expires in 24 hours):
${invite_url}

If you weren't expecting this, ignore this email.

— Panda Hailing, Tanzania`
}

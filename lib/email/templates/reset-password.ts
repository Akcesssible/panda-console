interface ResetPasswordEmailProps {
  full_name: string
  reset_url: string
  app_url:   string
}

export function resetPasswordEmailHtml({
  full_name,
  reset_url,
  app_url,
}: ResetPasswordEmailProps): string {
  const logoUrl = `${app_url}/panda-logo_console.png`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Panda Console password</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" type="text/css" />
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'DM Sans',Arial,Helvetica,sans-serif;">
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
    body, table, td, p, a, span { font-family: 'DM Sans', Arial, Helvetica, sans-serif !important; }
  </style>
  <!--<![endif]-->

  <!-- Outer gray wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;font-family:'DM Sans',Arial,Helvetica,sans-serif;">
    <tr>
      <td style="padding:48px 24px;">

        <!-- White card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:40px 48px 0 48px;">

        <!-- Logo -->
        <img src="${logoUrl}" alt="Panda Console" width="130" height="auto" style="display:block;margin-bottom:40px;" />

        <!-- Title -->
        <p style="margin:0 0 24px;font-size:28px;font-weight:700;color:#1d242d;line-height:1.2;">
          Reset Your Panda Console Password
        </p>

        <!-- Body -->
        <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.7;">
          Hi ${full_name}, we received a request to reset your Panda Console password.
          Click the button below to create a new password.
        </p>

        <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.7;">
          This link will expire in <strong style="color:#1d242d;">1 hour</strong> for your security.
        </p>

        <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.7;">
          If you did not request this, you can safely ignore this email.
          Your account will remain unchanged.
        </p>

        <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.7;">
          For any help, reach out to our support team at
          <a href="mailto:support@panda.tz" style="color:#2B39C7;text-decoration:none;">support@panda.tz</a>
        </p>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:48px;">
          <tr>
            <td style="background:#2B39C7;border-radius:8px;">
              <a href="${reset_url}"
                style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                Reset My Password
              </a>
            </td>
          </tr>
        </table>

        <!-- Fallback link -->
        <p style="margin:0 0 48px;font-size:12px;color:#9ca3af;line-height:1.6;">
          Button not working? Copy and paste this link into your browser:<br />
          <a href="${reset_url}" style="color:#2B39C7;word-break:break-all;">${reset_url}</a>
        </p>

            </td>
          </tr>

    <!-- Footer -->
          <tr>
      <td style="background:#1d242d;padding:32px 48px;border-radius:0 0 16px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <!-- Row 1: company + support -->
          <tr>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">
                Smart ride-hailing for Tanzania
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Built for you | Launching soon
              </p>
            </td>
            <td style="vertical-align:top;text-align:right;">
              <a href="mailto:support@panda.tz"
                style="font-size:13px;color:#9ca3af;text-decoration:none;">
                support@panda.tz
              </a>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td colspan="2" style="padding:20px 0;">
              <hr style="border:none;border-top:1px solid #374151;margin:0;" />
            </td>
          </tr>
          <!-- Row 2: privacy + copyright -->
          <tr>
            <td>
              <p style="margin:0;font-size:12px;color:#6b7280;">
                <a href="#" style="color:#6b7280;text-decoration:none;">Privacy Policy</a>
                <span style="margin:0 6px;">|</span>
                <a href="#" style="color:#6b7280;text-decoration:none;">Terms of Service</a>
              </p>
            </td>
            <td style="text-align:right;">
              <p style="margin:0;font-size:12px;color:#6b7280;">© 2026 Panda</p>
            </td>
          </tr>
        </table>
      </td>
          </tr>
        </table>
        <!-- /White card -->

      </td>
    </tr>
  </table>
  <!-- /Outer gray wrapper -->
</body>
</html>`
}

export function resetPasswordEmailText({
  full_name,
  reset_url,
}: ResetPasswordEmailProps): string {
  return `Hi ${full_name},

We received a request to reset your Panda Console password.
Click the link below to create a new password.

This link will expire in 1 hour for your security.

If you did not request this, you can safely ignore this email.
Your account will remain unchanged.

Reset link:
${reset_url}

For any help, reach out to: support@panda.tz

Panda Hailing, Tanzania
© 2026 Panda`
}

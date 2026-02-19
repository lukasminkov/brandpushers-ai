import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email, name, brandName } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const firstName = (name || 'there').split(' ')[0]

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);border-radius:24px 24px 0 0;padding:48px 40px;text-align:center;">
  <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">BrandPushers</h1>
  <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">Exclusive Access Granted</p>
</td></tr>

<!-- Body -->
<tr><td style="background:#111111;padding:48px 40px;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
  <h2 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;">Congratulations, ${firstName}! 🎉</h2>
  <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">You've been accepted into <strong style="color:#c084fc;">BrandPushers</strong>.</p>

  <p style="margin:0 0 16px;font-size:15px;color:#d4d4d8;line-height:1.7;">Your application${brandName ? ` for <strong style="color:#ffffff;">${brandName}</strong>` : ''} has been reviewed and approved. You've been selected to join an exclusive group of creators and entrepreneurs building the next generation of brands.</p>

  <p style="margin:0 0 16px;font-size:15px;color:#d4d4d8;line-height:1.7;">This is just the beginning. We're going to help you build something incredible — a brand that stands out, scales fast, and creates real value.</p>

  <p style="margin:0 0 32px;font-size:15px;color:#d4d4d8;line-height:1.7;">Your dashboard is ready. Log in to start your journey.</p>

  <!-- CTA -->
  <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
    <a href="https://brandpushers.ai/login" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:14px;letter-spacing:0.3px;">Access Your Dashboard</a>
  </td></tr></table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#0A0A0A;padding:32px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);border-radius:0 0 24px 24px;">
  <p style="margin:0 0 8px;font-size:13px;color:#52525b;">© 2026 WHUT.AI LLC (BrandPushers)</p>
  <p style="margin:0;font-size:12px;color:#3f3f46;">You received this because you applied at brandpushers.ai</p>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`

    const { data, error } = await resend.emails.send({
      from: 'BrandPushers <noreply@brandpushers.ai>',
      to: email,
      subject: "Welcome to BrandPushers 🔥 — You're In!",
      html,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

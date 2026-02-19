import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { agreement_id, signer_name, consent } = body

    if (!agreement_id || !signer_name || !consent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the IP address from the request
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

    const adminClient = getAdminClient()

    // Verify the agreement belongs to this user and is pending
    const { data: agreement, error: fetchErr } = await adminClient
      .from('equity_agreements')
      .select('id, brand_member_id, status')
      .eq('id', agreement_id)
      .eq('brand_member_id', user.id)
      .single()

    if (fetchErr || !agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }
    if (agreement.status !== 'pending') {
      return NextResponse.json({ error: 'Agreement is not in pending status' }, { status: 400 })
    }

    const signatureData = {
      signer_name,
      signer_ip: ip,
      timestamp: new Date().toISOString(),
      consent_text: consent,
      user_id: user.id,
      user_email: user.email,
    }

    // Get the agreement HTML and update it with the actual signature
    const { data: fullAgreement } = await adminClient
      .from('equity_agreements')
      .select('agreement_html')
      .eq('id', agreement_id)
      .single()

    let updatedHtml = fullAgreement?.agreement_html || ''
    if (updatedHtml) {
      // Get the member's profile to find their name for matching signature line
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      
      const signerDisplayName = profile?.full_name || signer_name
      const signedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      
      // Replace the blank signature line for the participant with actual signature
      // Look for sig-line divs and replace the blank line with the typed signature
      updatedHtml = updatedHtml.replace(
        new RegExp(`(<div class="sig-line"[^>]*data-stakeholder="${signerDisplayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>)<p>_________________________________</p>(<p class="sig-label">[^<]+</p>)<p class="sig-label">Date: ___________________</p>`),
        `$1<p style="font-family:'Brush Script MT',cursive;font-size:28px;color:#1a1a1a;margin:0">${signer_name}</p>$2<p class="sig-label">Date: ${signedDate}</p><p class="sig-label" style="color:#10b981;font-size:11px">✓ Electronically signed · ${new Date().toISOString()}</p>`
      )
      
      // Also try matching without data-stakeholder (for older agreements)
      if (updatedHtml === fullAgreement?.agreement_html) {
        // Fallback: replace first blank signature line (participant's)
        updatedHtml = updatedHtml.replace(
          /(<div class="sig-line">)<p>_________________________________<\/p>(<p class="sig-label">Participant)/,
          `$1<p style="font-family:'Brush Script MT',cursive;font-size:28px;color:#1a1a1a;margin:0">${signer_name}</p>$2`
        )
        updatedHtml = updatedHtml.replace(
          /Date: ___________________(<\/p><\/div>\s*<div class="sig-line">)/,
          `Date: ${signedDate}$1`
        )
      }
    }

    const { error: updateErr } = await adminClient
      .from('equity_agreements')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature_data: signatureData,
        agreement_html: updatedHtml,
      })
      .eq('id', agreement_id)
      .eq('brand_member_id', user.id)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to sign agreement' }, { status: 500 })
    }

    return NextResponse.json({ success: true, signed_at: new Date().toISOString() })
  } catch (err) {
    console.error('Sign agreement error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

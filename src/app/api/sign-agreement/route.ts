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

    const { error: updateErr } = await adminClient
      .from('equity_agreements')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature_data: signatureData,
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

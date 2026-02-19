import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service-role client — bypasses RLS so we can store applications before auth
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, brandName, category, stage, about } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const applicationData = {
      email,
      name,
      brand_stage: stage || 'idea',
      answers: {
        applicant_name: name,
        applicant_email: email,
        brandName: brandName || '',
        category: category || '',
        stage: stage || '',
        about: about || '',
      },
      status: 'pending',
    }

    // Check if an application for this email already exists
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing?.id) {
      // Update existing application (re-apply flow)
      await supabase
        .from('applications')
        .update(applicationData)
        .eq('id', existing.id)
    } else {
      // New application — no user_id yet, will be linked in auth callback
      await supabase.from('applications').insert(applicationData)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[apply] unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

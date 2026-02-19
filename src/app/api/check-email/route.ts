import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  
  if (!email) {
    return NextResponse.json({ exists: false })
  }

  // Use service role to check if user exists in auth.users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if there's a profile or application with this email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profile) {
    return NextResponse.json({ exists: true })
  }

  // Also check applications (they may have applied but not confirmed yet)
  const { data: application } = await supabase
    .from('applications')
    .select('id')
    .eq('email', email)
    .single()

  return NextResponse.json({ exists: !!application })
}

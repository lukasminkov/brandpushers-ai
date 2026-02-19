import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Link any pre-auth application to this user (best-effort, service role)
        try {
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { data: app } = await adminClient
            .from('applications')
            .select('id, user_id')
            .eq('email', user.email!)
            .maybeSingle()

          // If found and not yet linked, link it to this user's profile
          if (app && !app.user_id) {
            await adminClient
              .from('applications')
              .update({ user_id: user.id })
              .eq('id', app.id)
          }
        } catch (e) {
          console.error('[callback] application link error:', e)
          // Non-fatal — user can still proceed
        }

        // Route based on profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') return NextResponse.redirect(`${origin}/admin`)
        if (profile?.role === 'member') return NextResponse.redirect(`${origin}/dashboard`)
        return NextResponse.redirect(`${origin}/pending`)
      }
    }
  }

  // Fallback — send them to login instead of a dead end
  return NextResponse.redirect(`${origin}/login`)
}

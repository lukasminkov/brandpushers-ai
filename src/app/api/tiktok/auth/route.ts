import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAuthUrl } from '@/lib/tiktok/client'
import crypto from 'crypto'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Generate state with user ID for CSRF protection
    const statePayload = JSON.stringify({
      userId: user.id,
      nonce: crypto.randomBytes(16).toString('hex'),
    })
    const state = Buffer.from(statePayload).toString('base64url')
    
    const authUrl = getAuthUrl(state)
    
    return NextResponse.json({ url: authUrl })
  } catch (err) {
    console.error('TikTok auth error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to generate auth URL', detail: message }, { status: 500 })
  }
}

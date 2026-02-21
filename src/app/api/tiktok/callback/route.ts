import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAccessToken, getAuthorizedShops, tokenExpiryToDate } from '@/lib/tiktok/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/integrations?error=tiktok_auth_failed', request.url))
  }
  
  try {
    // Decode state to get userId
    const statePayload = JSON.parse(Buffer.from(state, 'base64url').toString())
    const userId = statePayload.userId
    
    if (!userId) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=tiktok_auth_failed', request.url))
    }
    
    // Exchange code for tokens
    const tokens = await getAccessToken(code)
    
    // Store in Supabase (using service role to bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const tokenExpiresAt = tokenExpiryToDate(tokens.access_token_expire_in)
    const refreshExpiresAt = tokenExpiryToDate(tokens.refresh_token_expire_in)
    
    // Try to get authorized shops (may fail if scope not granted yet)
    let shops: { id: string; cipher: string; name: string; region: string }[] = []
    try {
      shops = await getAuthorizedShops(tokens.access_token)
    } catch (shopErr) {
      console.warn('Could not fetch shops (scope may not be granted):', shopErr)
    }
    
    if (shops.length > 0) {
      // Store connection for each authorized shop
      for (const shop of shops) {
        await supabase
          .from('tiktok_connections')
          .upsert({
            user_id: userId,
            shop_id: shop.id,
            shop_cipher: shop.cipher,
            shop_name: shop.name,
            region: shop.region,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: tokenExpiresAt.toISOString(),
            refresh_token_expires_at: refreshExpiresAt.toISOString(),
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,shop_id',
          })
      }
    } else {
      // Store connection without shop info — will populate on first sync
      await supabase
        .from('tiktok_connections')
        .insert({
          user_id: userId,
          shop_name: 'TikTok Shop',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          refresh_token_expires_at: refreshExpiresAt.toISOString(),
        })
    }
    
    return NextResponse.redirect(new URL('/dashboard/integrations?tiktok=connected', request.url))
  } catch (err) {
    console.error('TikTok callback error:', err)
    return NextResponse.redirect(new URL('/dashboard/integrations?error=tiktok_auth_failed', request.url))
  }
}

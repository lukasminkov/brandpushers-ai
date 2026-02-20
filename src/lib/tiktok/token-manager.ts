/**
 * TikTok Token Manager
 * Handles auto-refresh of tokens before they expire
 */
import { createClient } from '@supabase/supabase-js'
import { refreshAccessToken, type TikTokTokens } from './client'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface TikTokConnection {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  shop_cipher: string
  shop_id: string
}

/**
 * Get a valid access token for a connection, refreshing if needed
 */
export async function getValidToken(connectionId: string): Promise<{
  accessToken: string
  connection: TikTokConnection
}> {
  const supabase = getServiceClient()
  
  const { data: conn, error } = await supabase
    .from('tiktok_connections')
    .select('*')
    .eq('id', connectionId)
    .single()
  
  if (error || !conn) {
    throw new Error(`Connection not found: ${connectionId}`)
  }
  
  const connection = conn as TikTokConnection
  const expiresAt = new Date(connection.token_expires_at)
  const now = new Date()
  
  // Refresh if token expires within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    try {
      const tokens: TikTokTokens = await refreshAccessToken(connection.refresh_token)
      
      const newExpiresAt = new Date(Date.now() + tokens.access_token_expire_in * 1000)
      const newRefreshExpiresAt = new Date(Date.now() + tokens.refresh_token_expire_in * 1000)
      
      await supabase
        .from('tiktok_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: newExpiresAt.toISOString(),
          refresh_token_expires_at: newRefreshExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId)
      
      return {
        accessToken: tokens.access_token,
        connection: { ...connection, access_token: tokens.access_token, refresh_token: tokens.refresh_token },
      }
    } catch (err) {
      console.error('Token refresh failed:', err)
      // If refresh fails and token isn't expired yet, use existing
      if (expiresAt > now) {
        return { accessToken: connection.access_token, connection }
      }
      throw new Error('Token expired and refresh failed')
    }
  }
  
  return { accessToken: connection.access_token, connection }
}

/**
 * Get all connections for a user
 */
export async function getUserConnections(userId: string): Promise<TikTokConnection[]> {
  const supabase = getServiceClient()
  
  const { data, error } = await supabase
    .from('tiktok_connections')
    .select('*')
    .eq('user_id', userId)
    .order('connected_at', { ascending: false })
  
  if (error) throw error
  return (data || []) as TikTokConnection[]
}

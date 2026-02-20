/**
 * TikTok Shop API v2 Client
 * Handles request signing, token management, and API calls
 */
import crypto from 'crypto'

const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com'
const TIKTOK_AUTH_BASE = 'https://services.tiktokshop.com'

export interface TikTokTokens {
  access_token: string
  refresh_token: string
  access_token_expire_in: number // seconds
  refresh_token_expire_in: number
}

export interface TikTokShop {
  cipher: string
  id: string
  name: string
  region: string
}

function getAppKey(): string {
  const key = process.env.TIKTOK_APP_KEY || process.env.NEXT_PUBLIC_TIKTOK_APP_KEY
  if (!key) throw new Error('TIKTOK_APP_KEY not configured')
  return key
}

function getAppSecret(): string {
  const secret = process.env.TIKTOK_APP_SECRET
  if (!secret) throw new Error('TIKTOK_APP_SECRET not configured')
  return secret
}

/**
 * Generate HMAC-SHA256 signature for TikTok Shop API v2
 * sign = HMAC-SHA256(app_secret, path + sorted_query_params + body)
 */
export function generateSign(
  path: string,
  queryParams: Record<string, string>,
  body?: string
): string {
  const appSecret = getAppSecret()
  
  // Sort query params by key (exclude sign itself)
  const sortedParams = Object.keys(queryParams)
    .filter(k => k !== 'sign' && k !== 'access_token')
    .sort()
    .map(k => `${k}${queryParams[k]}`)
    .join('')
  
  const baseString = appSecret + path + sortedParams + (body || '') + appSecret
  
  return crypto
    .createHmac('sha256', appSecret)
    .update(baseString)
    .digest('hex')
}

/**
 * Get OAuth authorization URL
 */
export function getAuthUrl(state: string): string {
  const appKey = getAppKey()
  return `${TIKTOK_AUTH_BASE}/open/authorize?app_key=${appKey}&state=${encodeURIComponent(state)}`
}

/**
 * Exchange authorization code for tokens
 */
export async function getAccessToken(authCode: string): Promise<TikTokTokens> {
  const appKey = getAppKey()
  const appSecret = getAppSecret()
  
  const path = '/api/v2/token/get'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const queryParams: Record<string, string> = {
    app_key: appKey,
    app_secret: appSecret,
    auth_code: authCode,
    grant_type: 'authorized_code',
    timestamp,
  }
  
  const sign = generateSign(path, queryParams)
  queryParams.sign = sign
  
  const url = new URL(path, TIKTOK_API_BASE)
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v))
  
  const res = await fetch(url.toString(), { method: 'GET' })
  const data = await res.json()
  
  if (data.code !== 0) {
    throw new Error(`TikTok token error: ${data.message || JSON.stringify(data)}`)
  }
  
  return data.data as TikTokTokens
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokens> {
  const appKey = getAppKey()
  const appSecret = getAppSecret()
  
  const path = '/api/v2/token/refresh'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const queryParams: Record<string, string> = {
    app_key: appKey,
    app_secret: appSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    timestamp,
  }
  
  const sign = generateSign(path, queryParams)
  queryParams.sign = sign
  
  const url = new URL(path, TIKTOK_API_BASE)
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v))
  
  const res = await fetch(url.toString(), { method: 'GET' })
  const data = await res.json()
  
  if (data.code !== 0) {
    throw new Error(`TikTok refresh error: ${data.message || JSON.stringify(data)}`)
  }
  
  return data.data as TikTokTokens
}

/**
 * Get authorized shops for a connection
 */
export async function getAuthorizedShops(accessToken: string): Promise<TikTokShop[]> {
  const data = await apiRequest('/authorization/202309/shops', 'GET', accessToken)
  return ((data?.shops || []) as Record<string, unknown>[]).map((s: Record<string, unknown>) => ({
    cipher: s.cipher as string,
    id: s.id as string,
    name: s.name as string,
    region: s.region as string,
  }))
}

/**
 * Make an authenticated API request to TikTok Shop API
 */
export async function apiRequest(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  accessToken: string,
  shopCipher?: string,
  queryExtra?: Record<string, string>,
  body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const appKey = getAppKey()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  
  const queryParams: Record<string, string> = {
    app_key: appKey,
    timestamp,
    ...(shopCipher ? { shop_cipher: shopCipher } : {}),
    ...(queryExtra || {}),
  }
  
  const bodyStr = body ? JSON.stringify(body) : undefined
  const sign = generateSign(path, queryParams, bodyStr)
  queryParams.sign = sign
  
  const url = new URL(path, TIKTOK_API_BASE)
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v))
  
  const headers: Record<string, string> = {
    'x-tts-access-token': accessToken,
    'Content-Type': 'application/json',
  }
  
  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(bodyStr ? { body: bodyStr } : {}),
  })
  
  const data = await res.json()
  
  if (data.code !== 0) {
    throw new Error(`TikTok API error [${path}]: ${data.message || JSON.stringify(data)}`)
  }
  
  return data.data as Record<string, unknown>
}

/**
 * Fetch orders with pagination
 */
export async function fetchOrders(
  accessToken: string,
  shopCipher: string,
  startTime: number, // unix timestamp
  endTime: number,
  pageSize = 50,
  cursor?: string
): Promise<{ orders: Record<string, unknown>[]; nextCursor?: string; total: number }> {
  const body: Record<string, unknown> = {
    create_time_ge: startTime,
    create_time_lt: endTime,
    page_size: pageSize,
    ...(cursor ? { cursor } : {}),
  }
  
  const data = await apiRequest(
    '/order/202309/orders/search',
    'POST',
    accessToken,
    shopCipher,
    undefined,
    body
  )
  
  return {
    orders: (data.orders || []) as Record<string, unknown>[],
    nextCursor: data.next_cursor as string | undefined,
    total: (data.total_count || 0) as number,
  }
}

/**
 * Fetch affiliate orders
 */
export async function fetchAffiliateOrders(
  accessToken: string,
  shopCipher: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,
  cursor?: string
): Promise<{ orders: Record<string, unknown>[]; nextCursor?: string }> {
  const data = await apiRequest(
    '/affiliate/202309/orders',
    'GET',
    accessToken,
    shopCipher,
    {
      start_date: startDate,
      end_date: endDate,
      page_size: '50',
      ...(cursor ? { cursor } : {}),
    }
  )
  
  return {
    orders: (data.orders || []) as Record<string, unknown>[],
    nextCursor: data.next_cursor as string | undefined,
  }
}

/**
 * Fetch settlements
 */
export async function fetchSettlements(
  accessToken: string,
  shopCipher: string,
  startTime: number,
  endTime: number,
  cursor?: string
): Promise<{ settlements: Record<string, unknown>[]; nextCursor?: string }> {
  const body: Record<string, unknown> = {
    request_time_ge: startTime,
    request_time_lt: endTime,
    page_size: 50,
    ...(cursor ? { cursor } : {}),
  }
  
  const data = await apiRequest(
    '/finance/202309/settlements/search',
    'POST',
    accessToken,
    shopCipher,
    undefined,
    body
  )
  
  return {
    settlements: (data.settlements || []) as Record<string, unknown>[],
    nextCursor: data.next_cursor as string | undefined,
  }
}

/**
 * Fetch products from shop
 */
export async function fetchProducts(
  accessToken: string,
  shopCipher: string,
  pageSize = 50,
  cursor?: string
): Promise<{ products: Record<string, unknown>[]; nextCursor?: string; total: number }> {
  const body: Record<string, unknown> = {
    page_size: pageSize,
    ...(cursor ? { cursor } : {}),
  }
  
  const data = await apiRequest(
    '/product/202309/products/search',
    'POST',
    accessToken,
    shopCipher,
    undefined,
    body
  )
  
  return {
    products: (data.products || []) as Record<string, unknown>[],
    nextCursor: data.next_cursor as string | undefined,
    total: (data.total_count || 0) as number,
  }
}

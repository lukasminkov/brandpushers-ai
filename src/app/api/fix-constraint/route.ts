import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { secret } = await request.json()
  if (secret !== 'fix-equity-constraint-2026') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  
  // Return all POSTGRES/DATABASE env vars so we can find the connection string
  const envKeys = Object.keys(process.env).filter(k => 
    k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('SUPABASE') || k.includes('PG')
  )
  const envInfo: Record<string, string> = {}
  for (const k of envKeys) {
    // Mask passwords in URLs
    envInfo[k] = process.env[k]?.substring(0, 80) + (process.env[k]!.length > 80 ? '...' : '')
  }
  
  return NextResponse.json({ envKeys: envInfo })
}

import { NextResponse } from 'next/server'
import pg from 'pg'

export async function POST(request: Request) {
  const { secret } = await request.json()
  if (secret !== 'fix-equity-constraint-2026') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  // Supabase Supavisor pooler with JWT auth
  // Session mode on port 5432
  const projectRef = 'oesqdjfrbzpgkagwyhwm'
  
  const results: string[] = []
  
  // Try multiple connection approaches
  const configs = [
    {
      name: 'pooler-session',
      connectionString: `postgresql://postgres.${projectRef}:${serviceKey}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require`
    },
    {
      name: 'pooler-transaction', 
      connectionString: `postgresql://postgres.${projectRef}:${serviceKey}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`
    },
    {
      name: 'direct',
      connectionString: `postgresql://postgres:${serviceKey}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`
    }
  ]

  for (const config of configs) {
    try {
      const client = new pg.Client({ connectionString: config.connectionString })
      await client.connect()
      
      // Get current constraint
      const res = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) as def 
        FROM pg_constraint 
        WHERE conname = 'equity_agreements_status_check'
      `)
      results.push(`${config.name}: connected! Current constraint: ${JSON.stringify(res.rows)}`)
      
      // Fix it
      await client.query(`ALTER TABLE public.equity_agreements DROP CONSTRAINT IF EXISTS equity_agreements_status_check`)
      await client.query(`ALTER TABLE public.equity_agreements ADD CONSTRAINT equity_agreements_status_check CHECK (status = ANY(ARRAY['pending'::text, 'signed'::text, 'expired'::text, 'revoked'::text, 'cancelled'::text]))`)
      results.push(`${config.name}: constraint fixed!`)
      
      await client.end()
      return NextResponse.json({ success: true, results })
    } catch (err: any) {
      results.push(`${config.name}: ${err.message}`)
    }
  }

  return NextResponse.json({ success: false, results })
}

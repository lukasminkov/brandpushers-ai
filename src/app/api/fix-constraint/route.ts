import { NextResponse } from 'next/server'
import postgres from 'postgres'

export async function POST(request: Request) {
  const { secret } = await request.json()
  if (secret !== 'fix-equity-constraint-2026') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const projectRef = 'oesqdjfrbzpgkagwyhwm'
  const results: string[] = []

  // Try connecting via Supabase Supavisor pooler with JWT auth
  // Session mode (port 5432) supports prepared statements
  const configs = [
    {
      name: 'pooler-session-jwt',
      host: `aws-0-eu-central-1.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${projectRef}`,
      password: serviceKey,
      database: 'postgres',
    },
    {
      name: 'pooler-transaction-jwt',
      host: `aws-0-eu-central-1.pooler.supabase.com`,
      port: 6543,
      user: `postgres.${projectRef}`,
      password: serviceKey,
      database: 'postgres',
    },
    {
      name: 'direct-jwt',
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      user: 'postgres',
      password: serviceKey,
      database: 'postgres',
    },
  ]

  for (const config of configs) {
    try {
      const sql = postgres({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: 'require',
        connect_timeout: 10,
        idle_timeout: 5,
        max: 1,
      })

      // Test connection
      const test = await sql`SELECT 1 as ok`
      results.push(`${config.name}: connected! test=${JSON.stringify(test)}`)

      // Get current constraint
      const current = await sql`
        SELECT conname, pg_get_constraintdef(oid) as def 
        FROM pg_constraint 
        WHERE conname = 'equity_agreements_status_check'
      `
      results.push(`${config.name}: current constraint = ${JSON.stringify(current)}`)

      // Fix it
      await sql`ALTER TABLE public.equity_agreements DROP CONSTRAINT IF EXISTS equity_agreements_status_check`
      await sql`ALTER TABLE public.equity_agreements ADD CONSTRAINT equity_agreements_status_check CHECK (status = ANY(ARRAY['pending'::text, 'signed'::text, 'expired'::text, 'revoked'::text, 'cancelled'::text]))`
      results.push(`${config.name}: CONSTRAINT FIXED!`)

      await sql.end()
      return NextResponse.json({ success: true, results })
    } catch (err: any) {
      results.push(`${config.name}: ERROR - ${err.message}`)
    }
  }

  return NextResponse.json({ success: false, results })
}

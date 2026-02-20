import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { secret } = await request.json()
  if (secret !== 'fix-equity-constraint-2026') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = 'oesqdjfrbzpgkagwyhwm'

  // Use Supabase's internal pg-meta API (accessible via service role key on the project URL)
  // The pg-meta API runs at /pg-meta/default/query
  const sql = `
    ALTER TABLE public.equity_agreements DROP CONSTRAINT IF EXISTS equity_agreements_status_check;
    ALTER TABLE public.equity_agreements ADD CONSTRAINT equity_agreements_status_check 
      CHECK (status = ANY(ARRAY['pending'::text, 'signed'::text, 'expired'::text, 'revoked'::text, 'cancelled'::text]));
  `

  // Try pg-meta endpoint
  const pgMetaRes = await fetch(`${supabaseUrl}/pg-meta/default/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'x-connection-encrypted': 'false',
    },
    body: JSON.stringify({ query: sql }),
  })

  const pgMetaText = await pgMetaRes.text()

  return NextResponse.json({
    pgMeta: { status: pgMetaRes.status, body: pgMetaText.substring(0, 500) },
  })
}

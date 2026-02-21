import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { getValidToken } from '@/lib/tiktok/token-manager'
import { fetchStatementTransactions } from '@/lib/tiktok/client'

/**
 * Debug endpoint: fetch raw statement transactions from TikTok Finance API
 * to inspect what fields/types are available (including potential ad spend data).
 * GET /api/tiktok/debug-statements?connectionId=xxx&days=30
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const connectionId = request.nextUrl.searchParams.get('connectionId')
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30')
    if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

    const { accessToken, connection } = await getValidToken(connectionId)
    const shopCipher = connection.shop_cipher
    if (!shopCipher) return NextResponse.json({ error: 'No shop_cipher' }, { status: 400 })

    const endTs = Math.floor(Date.now() / 1000)
    const startTs = endTs - days * 86400

    let allTx: Record<string, unknown>[] = []
    let cursor: string | undefined
    let pages = 0
    do {
      const page = await fetchStatementTransactions(accessToken, shopCipher, startTs, endTs, 100, cursor)
      allTx = allTx.concat(page.transactions)
      cursor = page.nextCursor
      pages++
    } while (cursor && pages < 10)

    // Group by type
    const byType: Record<string, { count: number; sample: Record<string, unknown>; totalAmount: number }> = {}
    for (const tx of allTx) {
      const type = String(tx.statement_type || tx.type || tx.transaction_type || 'unknown')
      if (!byType[type]) byType[type] = { count: 0, sample: tx, totalAmount: 0 }
      byType[type].count++
      byType[type].totalAmount += Math.abs(parseFloat(String(tx.amount || tx.total_amount || tx.settlement_amount || 0)))
    }

    // Also look for any field containing "ad" or "promotion" in any transaction
    const adRelatedFields: Record<string, unknown>[] = []
    for (const tx of allTx.slice(0, 5)) {
      const adFields: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(tx)) {
        if (/ad|promo|campaign|gmv_max|advertis/i.test(k) || /ad|promo|campaign|gmv_max|advertis/i.test(String(v))) {
          adFields[k] = v
        }
      }
      if (Object.keys(adFields).length > 0) adRelatedFields.push({ ...adFields, _order_id: tx.order_id })
    }

    return NextResponse.json({
      total_transactions: allTx.length,
      pages_fetched: pages,
      types: Object.fromEntries(
        Object.entries(byType).map(([type, info]) => [type, {
          count: info.count,
          totalAmount: info.totalAmount,
          sampleFields: Object.keys(info.sample),
          sample: info.sample,
        }])
      ),
      ad_related_fields: adRelatedFields,
      all_field_names: [...new Set(allTx.flatMap(tx => Object.keys(tx)))],
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

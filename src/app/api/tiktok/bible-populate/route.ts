import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Populate Bible daily entries from synced TikTok order/affiliate/settlement data.
 * Aggregates by day and upserts into bible_daily_entries + bible_product_daily_units.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { connectionId, startDate, endDate, platformFeePercent = 9 } = await request.json()
    if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

    const supabase = getServiceClient()

    // Fetch all TikTok orders in date range
    const { data: orders } = await supabase
      .from('tiktok_orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('connection_id', connectionId)
      .gte('order_create_time', `${startDate}T00:00:00Z`)
      .lte('order_create_time', `${endDate}T23:59:59Z`)

    // Fetch affiliate orders in date range
    const { data: affOrders } = await supabase
      .from('tiktok_affiliate_orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('connection_id', connectionId)
      .gte('order_create_time', `${startDate}T00:00:00Z`)
      .lte('order_create_time', `${endDate}T23:59:59Z`)

    // Fetch settlements (may lag)
    const { data: settlements } = await supabase
      .from('tiktok_settlements')
      .select('*')
      .eq('user_id', user.id)
      .eq('connection_id', connectionId)

    // Fetch product mappings
    const { data: tiktokProducts } = await supabase
      .from('tiktok_products')
      .select('product_id, bible_product_id')
      .eq('user_id', user.id)
      .eq('connection_id', connectionId)

    const productMap = new Map<string, string>()
    for (const tp of tiktokProducts || []) {
      if (tp.bible_product_id) productMap.set(tp.product_id, tp.bible_product_id)
    }

    // Aggregate orders by day
    const dailyMap = new Map<string, {
      gross_revenue: number
      refunds: number
      num_orders: number
      commissions: number
      productUnits: Map<string, number> // product_id -> units
    }>()

    for (const order of orders || []) {
      const date = new Date(order.order_create_time).toISOString().slice(0, 10)
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { gross_revenue: 0, refunds: 0, num_orders: 0, commissions: 0, productUnits: new Map() })
      }
      const day = dailyMap.get(date)!
      day.gross_revenue += parseFloat(order.total_amount || 0)
      day.refunds += parseFloat(order.refund_amount || 0)
      day.num_orders += 1

      // Product units from order items
      const items = order.items as { product_id?: string; quantity?: number }[] || []
      for (const item of items) {
        if (item.product_id) {
          const bibleId = productMap.get(item.product_id)
          if (bibleId) {
            day.productUnits.set(bibleId, (day.productUnits.get(bibleId) || 0) + (item.quantity || 1))
          }
        }
      }
    }

    // Add affiliate commissions by day
    for (const aff of affOrders || []) {
      const date = new Date(aff.order_create_time).toISOString().slice(0, 10)
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { gross_revenue: 0, refunds: 0, num_orders: 0, commissions: 0, productUnits: new Map() })
      }
      dailyMap.get(date)!.commissions += parseFloat(aff.commission_amount || 0)
    }

    // Build settlement lookup by date for match percentage
    const settlementByDate = new Map<string, { platform_fee: number; affiliate_commission: number }>()
    for (const s of settlements || []) {
      if (s.settlement_time) {
        const date = new Date(s.settlement_time).toISOString().slice(0, 10)
        settlementByDate.set(date, {
          platform_fee: parseFloat(s.platform_fee || 0),
          affiliate_commission: parseFloat(s.affiliate_commission || 0),
        })
      }
    }

    let daysUpdated = 0

    for (const [date, day] of dailyMap) {
      const estimatedPlatformFee = day.gross_revenue * (platformFeePercent / 100)
      const settlement = settlementByDate.get(date)

      // Use settlement data if available, otherwise estimated
      const platformFee = settlement ? settlement.platform_fee : estimatedPlatformFee
      const commissions = settlement ? settlement.affiliate_commission : day.commissions

      // Calculate match percentage
      let matchPct = 50 // default: estimated only
      if (settlement) {
        matchPct = 100 // settlement data confirmed
      }

      // Upsert Bible daily entry
      // First check if entry exists
      const { data: existing } = await supabase
        .from('bible_daily_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('platform', 'tiktok_shop')
        .single()

      let entryId: string
      if (existing) {
        // Update only TikTok-synced fields, preserve manual fields (postage, pick_pack, key_changes)
        await supabase
          .from('bible_daily_entries')
          .update({
            gross_revenue: day.gross_revenue,
            refunds: day.refunds,
            num_orders: day.num_orders,
            platform_fee: platformFee,
            commissions,
          })
          .eq('id', existing.id)
        entryId = existing.id
      } else {
        const { data: newEntry } = await supabase
          .from('bible_daily_entries')
          .insert({
            user_id: user.id,
            date,
            platform: 'tiktok_shop',
            gross_revenue: day.gross_revenue,
            refunds: day.refunds,
            num_orders: day.num_orders,
            platform_fee: platformFee,
            commissions,
            gmv_max_ad_spend: 0,
            ad_spend: 0,
            ad_spend_pct: 0,
            postage_pick_pack: 0,
            pick_pack: 0,
          })
          .select('id')
          .single()
        entryId = newEntry?.id
      }

      // Upsert product units
      if (entryId) {
        for (const [bibleProductId, units] of day.productUnits) {
          await supabase
            .from('bible_product_daily_units')
            .upsert({
              entry_id: entryId,
              product_id: bibleProductId,
              user_id: user.id,
              date,
              platform: 'tiktok_shop',
              units_sold: units,
            }, { onConflict: 'entry_id,product_id' })
        }
      }

      // Log sync with match percentage
      await supabase
        .from('bible_sync_log')
        .upsert({
          user_id: user.id,
          sync_date: date,
          platform: 'tiktok_shop',
          estimated_data: {
            gross_revenue: day.gross_revenue,
            platform_fee: estimatedPlatformFee,
            commissions: day.commissions,
          },
          settled_data: settlement || null,
          match_percentage: matchPct,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,sync_date,platform' })

      daysUpdated++
    }

    return NextResponse.json({ success: true, daysUpdated })
  } catch (err) {
    console.error('Bible populate error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Populate failed' },
      { status: 500 }
    )
  }
}

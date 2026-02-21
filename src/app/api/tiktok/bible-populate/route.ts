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
 * Convert a UTC ISO timestamp to a YYYY-MM-DD date string in the given timezone.
 * TikTok Shop US reports in Pacific Time, so we default to America/Los_Angeles.
 */
function toDateInTimezone(isoString: string, timezone: string): string {
  const d = new Date(isoString)
  // Use Intl to get the date parts in the target timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d) // en-CA gives YYYY-MM-DD format
  return parts
}

/**
 * Calculate GMV from order line items: sum of (quantity × sale_price).
 * This matches TikTok's "Gross Merchandise Value" metric.
 */
function calculateOrderGMV(order: Record<string, unknown>): number {
  // Use raw_data which has the original TikTok response with line items
  const rawData = (order.raw_data || order) as Record<string, unknown>
  const lineItems = (rawData.line_items || rawData.order_line_list || []) as Record<string, unknown>[]
  
  let gmv = 0
  for (const item of lineItems) {
    const qty = parseFloat(String(item.quantity || 1))
    const price = parseFloat(String(
      item.sale_price || item.sku_sale_price || item.original_price || item.item_price || 0
    ))
    gmv += qty * price
  }
  
  // If no line items found, fall back to the pre-calculated gmv field or subtotal
  if (gmv === 0) {
    gmv = parseFloat(String(order.gmv || order.subtotal || order.total_amount || 0))
  }
  
  return gmv
}

/**
 * Populate Bible daily entries from synced TikTok order/affiliate/settlement data.
 * Aggregates by day (in shop timezone) and upserts into bible_daily_entries + bible_product_daily_units.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { connectionId, startDate, endDate, platformFeePercent = 9 } = await request.json()
    if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

    const supabase = getServiceClient()

    // Get connection timezone (defaults to America/Los_Angeles for US shops)
    const { data: connData } = await supabase
      .from('tiktok_connections')
      .select('timezone')
      .eq('id', connectionId)
      .single()
    const timezone = connData?.timezone || 'America/Los_Angeles'

    // Fetch all TikTok orders in date range
    // Fetch all orders — must override Supabase default 1000-row limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allOrders: any[] = []
    let from = 0
    const PAGE = 1000
    while (true) {
      const { data: page } = await supabase
        .from('tiktok_orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_id', connectionId)
        .gte('order_create_time', `${startDate}T00:00:00Z`)
        .lte('order_create_time', `${endDate}T23:59:59Z`)
        .range(from, from + PAGE - 1)
      if (!page || page.length === 0) break
      allOrders = allOrders.concat(page)
      if (page.length < PAGE) break
      from += PAGE
    }
    const orders = allOrders

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

    // Fetch variant mappings (sku_id -> variant_id + product_id)
    // Wrapped in try/catch — table may not exist if migration 006 hasn't been run
    const bibleProductIds = [...new Set(productMap.values())]
    const variantMap = new Map<string, { variantId: string; productId: string }>()
    try {
      const { data: variants } = bibleProductIds.length > 0
        ? await supabase
            .from('bible_product_variants')
            .select('id, bible_product_id, sku_id')
            .in('bible_product_id', bibleProductIds)
        : { data: [] }

      for (const v of variants || []) {
        if (v.sku_id) variantMap.set(v.sku_id, { variantId: v.id, productId: v.bible_product_id })
      }
    } catch (variantErr) {
      console.warn('bible_product_variants table may not exist yet:', variantErr)
    }

    // Aggregate orders by day (converted to shop timezone)
    const dailyMap = new Map<string, {
      gross_revenue: number // GMV = sum of line item prices
      refunds: number
      num_orders: number
      commissions: number
      shipping_fee: number
      productUnits: Map<string, number>
      variantUnits: Map<string, number>
    }>()

    // TikTok order statuses to exclude from order count and GMV
    const CANCELLED_STATUSES = new Set(['CANCELLED', 'CANCEL', 'cancelled', 'cancel'])

    for (const order of orders || []) {
      const orderStatus = (order.order_status || '') as string

      // Skip cancelled orders entirely — they don't count in TikTok analytics
      if (CANCELLED_STATUSES.has(orderStatus)) continue

      // Convert order time to shop timezone for date grouping
      const date = toDateInTimezone(order.order_create_time, timezone)
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { gross_revenue: 0, refunds: 0, num_orders: 0, commissions: 0, shipping_fee: 0, productUnits: new Map(), variantUnits: new Map() })
      }
      const day = dailyMap.get(date)!

      // Use GMV (sum of line item prices) instead of total_amount
      day.gross_revenue += calculateOrderGMV(order)
      day.refunds += parseFloat(order.refund_amount || 0)
      day.shipping_fee += parseFloat(order.shipping_fee || 0)
      day.num_orders += 1

      // Product + variant units from order items
      const items = order.items as { product_id?: string; sku_id?: string; quantity?: number }[] || []
      for (const item of items) {
        if (item.product_id) {
          const bibleId = productMap.get(item.product_id)
          if (bibleId) {
            day.productUnits.set(bibleId, (day.productUnits.get(bibleId) || 0) + (item.quantity || 1))
          }
        }
        if (item.sku_id) {
          const variantInfo = variantMap.get(item.sku_id)
          if (variantInfo) {
            day.variantUnits.set(variantInfo.variantId, (day.variantUnits.get(variantInfo.variantId) || 0) + (item.quantity || 1))
          }
        }
      }
    }

    // Add affiliate commissions by day (also timezone-converted)
    for (const aff of affOrders || []) {
      const date = toDateInTimezone(aff.order_create_time, timezone)
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { gross_revenue: 0, refunds: 0, num_orders: 0, commissions: 0, shipping_fee: 0, productUnits: new Map(), variantUnits: new Map() })
      }
      dailyMap.get(date)!.commissions += parseFloat(aff.commission_amount || 0)
    }

    // Build settlement lookup by date for match percentage
    const settlementByDate = new Map<string, { platform_fee: number; affiliate_commission: number }>()
    for (const s of settlements || []) {
      if (s.settlement_time) {
        const date = toDateInTimezone(s.settlement_time, timezone)
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

      const platformFee = settlement ? settlement.platform_fee : estimatedPlatformFee
      const commissions = settlement ? settlement.affiliate_commission : day.commissions

      let matchPct = 50
      if (settlement) matchPct = 100

      // Upsert Bible daily entry
      const { data: existing } = await supabase
        .from('bible_daily_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('platform', 'tiktok_shop')
        .single()

      let entryId: string
      if (existing) {
        await supabase
          .from('bible_daily_entries')
          .update({
            gross_revenue: day.gross_revenue,
            refunds: day.refunds,
            num_orders: day.num_orders,
            platform_fee: platformFee,
            commissions,
            shipping_fee: day.shipping_fee,
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
            shipping_fee: day.shipping_fee,
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

        // Variant units — table may not exist if migration 006 hasn't been run
        try {
          for (const [variantId, units] of day.variantUnits) {
            const variantInfo = [...variantMap.values()].find(v => v.variantId === variantId)
            if (variantInfo) {
              await supabase
                .from('bible_variant_daily_units')
                .upsert({
                  entry_id: entryId,
                  variant_id: variantId,
                  product_id: variantInfo.productId,
                  user_id: user.id,
                  date,
                  platform: 'tiktok_shop',
                  units_sold: units,
                }, { onConflict: 'entry_id,variant_id' })
            }
          }
        } catch (variantUpsertErr) {
          console.warn('Variant daily units upsert failed (migration 006 not run?):', variantUpsertErr)
        }
      }

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

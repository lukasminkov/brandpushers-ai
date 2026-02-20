import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { getValidToken } from '@/lib/tiktok/token-manager'
import {
  fetchOrders,
  fetchAffiliateOrders,
  fetchSettlements,
  fetchProducts,
  getAuthorizedShops,
} from '@/lib/tiktok/client'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { connectionId, syncType = 'all', startDate, endDate } = body

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Update sync status
    await supabase
      .from('tiktok_connections')
      .update({ sync_status: 'syncing', sync_error: null })
      .eq('id', connectionId)

    try {
      const { accessToken, connection } = await getValidToken(connectionId)
      let shopCipher = connection.shop_cipher

      // If shop_cipher is missing, try to fetch it now
      if (!shopCipher) {
        const shops = await getAuthorizedShops(accessToken)
        if (shops.length > 0) {
          shopCipher = shops[0].cipher
          await supabase
            .from('tiktok_connections')
            .update({
              shop_cipher: shops[0].cipher,
              shop_id: shops[0].id,
              shop_name: shops[0].name,
              region: shops[0].region,
            })
            .eq('id', connectionId)
        } else {
          throw new Error('No authorized shops found. Please reconnect your TikTok Shop.')
        }
      }

      // Default: last 30 days
      const end = endDate ? new Date(endDate) : new Date()
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      const startTs = Math.floor(start.getTime() / 1000)
      const endTs = Math.floor(end.getTime() / 1000)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      const results: Record<string, unknown> = {}

      // Sync orders
      if (syncType === 'all' || syncType === 'orders') {
        let allOrders: Record<string, unknown>[] = []
        let cursor: string | undefined
        do {
          const page = await fetchOrders(accessToken, shopCipher, startTs, endTs, 50, cursor)
          allOrders = allOrders.concat(page.orders)
          cursor = page.nextCursor
        } while (cursor)

        // Upsert orders
        for (const order of allOrders) {
          const items = ((order.line_items || order.order_line_list || []) as Record<string, unknown>[]).map(
            (item: Record<string, unknown>) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              sku_id: item.sku_id,
              sku_name: item.sku_name,
              quantity: item.quantity,
              price: item.sale_price || item.original_price,
            })
          )

          await supabase.from('tiktok_orders').upsert({
            user_id: user.id,
            connection_id: connectionId,
            order_id: order.id as string,
            order_status: order.status as string,
            payment_status: (order.payment as Record<string, unknown>)?.status as string,
            total_amount: parseFloat(((order.payment as Record<string, unknown>)?.total_amount || '0') as string),
            subtotal: parseFloat(((order.payment as Record<string, unknown>)?.sub_total || '0') as string),
            shipping_fee: parseFloat(((order.payment as Record<string, unknown>)?.shipping_fee || '0') as string),
            platform_discount: parseFloat(((order.payment as Record<string, unknown>)?.platform_discount || '0') as string),
            seller_discount: parseFloat(((order.payment as Record<string, unknown>)?.seller_discount || '0') as string),
            refund_amount: parseFloat(String(order.refund_amount || '0')),
            currency: ((order.payment as Record<string, unknown>)?.currency || 'USD') as string,
            order_create_time: order.create_time ? new Date((order.create_time as number) * 1000).toISOString() : null,
            order_paid_time: order.paid_time ? new Date((order.paid_time as number) * 1000).toISOString() : null,
            items,
            raw_data: order,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,order_id' })
        }

        results.orders = allOrders.length
      }

      // Sync affiliate orders (non-fatal — scope may not be granted)
      if (syncType === 'all' || syncType === 'affiliate') {
        try {
          let allAffOrders: Record<string, unknown>[] = []
          let cursor: string | undefined
          do {
            const page = await fetchAffiliateOrders(accessToken, shopCipher, startStr, endStr, cursor)
            allAffOrders = allAffOrders.concat(page.orders)
            cursor = page.nextCursor
          } while (cursor)

          for (const order of allAffOrders) {
            await supabase.from('tiktok_affiliate_orders').upsert({
              user_id: user.id,
              connection_id: connectionId,
              order_id: order.order_id as string,
              affiliate_type: order.collaboration_type as string,
              commission_rate: parseFloat(String(order.commission_rate || '0')),
              commission_amount: parseFloat(String(order.estimated_commission || '0')),
              order_amount: parseFloat(String(order.total_payment_amount || '0')),
              product_id: order.product_id as string,
              product_name: order.product_name as string,
              creator_username: order.creator_username as string,
              order_create_time: order.create_time ? new Date((order.create_time as number) * 1000).toISOString() : null,
              raw_data: order,
            }, { onConflict: 'user_id,order_id,affiliate_type' })
          }

          results.affiliate_orders = allAffOrders.length
        } catch (affErr) {
          console.warn('Affiliate sync skipped:', affErr)
          results.affiliate_orders = 'skipped (scope not available)'
        }
      }

      // Sync settlements (non-fatal)
      if (syncType === 'all' || syncType === 'settlements') {
        try {
          let allSettlements: Record<string, unknown>[] = []
          let cursor: string | undefined
          do {
            const page = await fetchSettlements(accessToken, shopCipher, startTs, endTs, cursor)
            allSettlements = allSettlements.concat(page.settlements)
            cursor = page.nextCursor
          } while (cursor)

          for (const settlement of allSettlements) {
            await supabase.from('tiktok_settlements').upsert({
              user_id: user.id,
              connection_id: connectionId,
              settlement_id: settlement.id as string,
              settlement_time: settlement.settlement_time ? new Date((settlement.settlement_time as number) * 1000).toISOString() : null,
              settlement_amount: parseFloat(String(settlement.settlement_amount || '0')),
              revenue: parseFloat(String(settlement.revenue || '0')),
              platform_fee: parseFloat(String(settlement.platform_fee || '0')),
              affiliate_commission: parseFloat(String(settlement.affiliate_commission || '0')),
              shipping_fee_subsidy: parseFloat(String(settlement.shipping_fee_subsidy || '0')),
              refund_amount: parseFloat(String(settlement.refund_amount || '0')),
              adjustment: parseFloat(String(settlement.adjustment || '0')),
              currency: (settlement.currency || 'USD') as string,
              raw_data: settlement,
            }, { onConflict: 'user_id,settlement_id' })
          }

          results.settlements = allSettlements.length
        } catch (settErr) {
          console.warn('Settlement sync skipped:', settErr)
          results.settlements = 'skipped'
        }
      }

      // Sync products
      if (syncType === 'all' || syncType === 'products') {
        let allProducts: Record<string, unknown>[] = []
        let cursor: string | undefined
        do {
          const page = await fetchProducts(accessToken, shopCipher, 50, cursor)
          allProducts = allProducts.concat(page.products)
          cursor = page.nextCursor
        } while (cursor)

        for (const product of allProducts) {
          // Upsert TikTok product
          await supabase.from('tiktok_products').upsert({
            user_id: user.id,
            connection_id: connectionId,
            product_id: product.id as string,
            product_name: product.title as string,
            product_status: product.status as string,
            skus: product.skus || [],
            raw_data: product,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,product_id' })

          // Auto-create Bible product if not linked
          const { data: existing } = await supabase
            .from('tiktok_products')
            .select('bible_product_id')
            .eq('user_id', user.id)
            .eq('product_id', product.id as string)
            .single()

          if (!existing?.bible_product_id) {
            const { data: bibleProduct } = await supabase
              .from('bible_products')
              .insert({
                user_id: user.id,
                name: product.title as string,
                sku: product.id as string,
                cogs: 0,
                platform: 'tiktok_shop',
              })
              .select('id')
              .single()

            if (bibleProduct) {
              await supabase
                .from('tiktok_products')
                .update({ bible_product_id: bibleProduct.id })
                .eq('user_id', user.id)
                .eq('product_id', product.id as string)
            }
          }
        }

        // Clean up non-live products: remove tiktok_products + linked bible_products
        const liveProductIds = allProducts.map(p => p.id as string)
        const { data: staleProducts } = await supabase
          .from('tiktok_products')
          .select('id, product_id, bible_product_id')
          .eq('user_id', user.id)
          .eq('connection_id', connectionId)

        if (staleProducts) {
          const toRemove = staleProducts.filter(p => !liveProductIds.includes(p.product_id))
          for (const stale of toRemove) {
            // Delete linked bible product
            if (stale.bible_product_id) {
              await supabase.from('bible_products').delete().eq('id', stale.bible_product_id)
            }
            // Delete tiktok product
            await supabase.from('tiktok_products').delete().eq('id', stale.id)
          }
          results.products_removed = toRemove.length
        }

        results.products = allProducts.length
      }

      // Update connection status
      await supabase
        .from('tiktok_connections')
        .update({
          sync_status: 'idle',
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId)

      return NextResponse.json({ success: true, results })
    } catch (syncErr) {
      await supabase
        .from('tiktok_connections')
        .update({
          sync_status: 'error',
          sync_error: syncErr instanceof Error ? syncErr.message : 'Unknown error',
        })
        .eq('id', connectionId)

      throw syncErr
    }
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

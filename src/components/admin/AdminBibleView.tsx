'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

interface Product { id: string; name: string; cogs: number; platform: string }
interface DailyEntry {
  id: string; date: string; platform: string
  gross_revenue: number; refunds: number; num_orders: number
  platform_fee: number; commissions: number; gmv_max_ad_spend: number
  ad_spend: number; postage_pick_pack: number; key_changes: string | null
}
interface ProductUnits { id: string; entry_id: string; product_id: string; units_sold: number }

type Platform = 'tiktok_shop' | 'amazon' | 'shopify'

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'tiktok_shop', label: 'TikTok Shop' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'shopify', label: 'Shopify' },
]

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'

export default function AdminBibleView({ memberId, memberName }: { memberId: string; memberName: string }) {
  const supabase = createClient()
  const [platform, setPlatform] = useState<Platform>('tiktok_shop')
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [allUnits, setAllUnits] = useState<ProductUnits[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('bible_products').select('*').eq('user_id', memberId).eq('platform', platform).order('created_at'),
      supabase.from('bible_daily_entries').select('*').eq('user_id', memberId).eq('platform', platform).order('date', { ascending: false }).limit(90),
      supabase.from('bible_product_daily_units').select('*').eq('user_id', memberId).eq('platform', platform),
    ]).then(([{ data: p }, { data: e }, { data: u }]) => {
      setProducts((p || []) as Product[])
      setEntries((e || []) as DailyEntry[])
      setAllUnits((u || []) as ProductUnits[])
      setLoading(false)
    })
  }, [memberId, platform, supabase])

  const getUnits = (entryId: string, productId: string) =>
    allUnits.find(u => u.entry_id === entryId && u.product_id === productId)?.units_sold || 0
  const getTotalUnits = (entryId: string) =>
    allUnits.filter(u => u.entry_id === entryId).reduce((s, u) => s + u.units_sold, 0)
  const getProductCost = (entryId: string) =>
    products.reduce((s, p) => s + getUnits(entryId, p.id) * p.cogs, 0)
  const getProfit = (e: DailyEntry) =>
    e.gross_revenue - e.refunds - e.platform_fee - e.commissions - e.gmv_max_ad_spend - e.ad_spend - getProductCost(e.id) - e.postage_pick_pack

  const chartData = useMemo(() =>
    [...entries].reverse().map(e => ({
      date: e.date.slice(5),
      'Gross Revenue': e.gross_revenue,
      'Net Profit': getProfit(e),
      'Ad Spend': e.ad_spend + e.gmv_max_ad_spend,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [entries, allUnits, products])

  const totals = useMemo(() => {
    const t = { gross_revenue: 0, refunds: 0, num_orders: 0, total_units: 0, platform_fee: 0, commissions: 0, gmv_max_ad_spend: 0, ad_spend: 0, product_cost: 0, postage_pick_pack: 0, profit: 0 }
    entries.forEach(e => {
      t.gross_revenue += e.gross_revenue; t.refunds += e.refunds; t.num_orders += e.num_orders
      t.total_units += getTotalUnits(e.id); t.platform_fee += e.platform_fee; t.commissions += e.commissions
      t.gmv_max_ad_spend += e.gmv_max_ad_spend; t.ad_spend += e.ad_spend
      t.product_cost += getProductCost(e.id); t.postage_pick_pack += e.postage_pick_pack; t.profit += getProfit(e)
    })
    return t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, allUnits, products])

  if (loading) return <div className="flex justify-center py-12"><div className="spinner" /></div>

  if (entries.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-gray-500">No Bible entries yet for {memberName}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Platform tabs */}
      <div className="flex gap-1 border-b border-white/[0.07] pb-px">
        {PLATFORMS.map(p => (
          <button key={p.key} onClick={() => setPlatform(p.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${platform === p.key ? 'border-[#F24822] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >{p.label}</button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="glass rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="abRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9B0EE5" stopOpacity={0.3}/><stop offset="95%" stopColor="#9B0EE5" stopOpacity={0}/></linearGradient>
                <linearGradient id="abProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                <linearGradient id="abAd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F57B18" stopOpacity={0.3}/><stop offset="95%" stopColor="#F57B18" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`€${fmt(Number(v || 0))}`, undefined]} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Area type="monotone" dataKey="Gross Revenue" stroke="#9B0EE5" fill="url(#abRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="Net Profit" stroke="#22c55e" fill="url(#abProfit)" strokeWidth={2} />
              <Area type="monotone" dataKey="Ad Spend" stroke="#F57B18" fill="url(#abAd)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Revenue', value: `€${fmt(totals.gross_revenue)}`, color: '#9B0EE5' },
          { label: 'Profit', value: `€${fmt(totals.profit)}`, color: totals.profit >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Ad Spend', value: `€${fmt(totals.ad_spend + totals.gmv_max_ad_spend)}`, color: '#F57B18' },
          { label: 'Orders', value: totals.num_orders.toString(), color: '#6b7280' },
        ].map(c => (
          <div key={c.label} className="glass rounded-xl p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">{c.label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th className="px-3 py-3 text-left font-medium sticky left-0 z-10" style={{ background: '#1a1a1a' }}>Date</th>
                <th className="px-3 py-3 text-right font-medium">Revenue</th>
                <th className="px-3 py-3 text-right font-medium">Refunds</th>
                <th className="px-3 py-3 text-right font-medium">Orders</th>
                <th className="px-3 py-3 text-right font-medium">Units</th>
                <th className="px-3 py-3 text-right font-medium">Fees</th>
                <th className="px-3 py-3 text-right font-medium">Ad Spend</th>
                <th className="px-3 py-3 text-right font-medium">Prod Cost</th>
                <th className="px-3 py-3 text-right font-medium">P/L</th>
                <th className="px-3 py-3 text-right font-medium">P/L %</th>
                <th className="px-3 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => {
                const profit = getProfit(e)
                const profitPct = e.gross_revenue > 0 ? (profit / e.gross_revenue) * 100 : 0
                const cls = profit >= 0 ? 'text-green-400' : 'text-red-400'
                return (
                  <tr key={e.id} className="border-t border-white/[0.04]">
                    <td className="px-3 py-2 text-sm font-medium sticky left-0 z-10 whitespace-nowrap" style={{ background: '#141414' }}>
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">€{fmt(e.gross_revenue)}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">€{fmt(e.refunds)}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">{e.num_orders}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">{getTotalUnits(e.id)}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">€{fmt(e.platform_fee + e.commissions)}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">€{fmt(e.ad_spend + e.gmv_max_ad_spend)}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">€{fmt(getProductCost(e.id))}</td>
                    <td className={`px-3 py-2 text-sm text-right tabular-nums font-semibold ${cls}`}>€{fmt(profit)}</td>
                    <td className={`px-3 py-2 text-sm text-right tabular-nums ${cls}`}>{fmtPct(profitPct)}</td>
                    <td className="px-3 py-2 text-sm text-gray-400 max-w-[200px] truncate">{e.key_changes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

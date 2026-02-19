'use client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, X, Trash2, Edit3, ChevronDown, Calendar,
  TrendingUp, TrendingDown, Package, DollarSign
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────
interface Product {
  id: string
  name: string
  sku: string | null
  cogs: number
  platform: string
}

interface DailyEntry {
  id: string
  date: string
  platform: string
  gross_revenue: number
  refunds: number
  num_orders: number
  platform_fee: number
  commissions: number
  gmv_max_ad_spend: number
  ad_spend: number
  ad_spend_pct: number
  postage_pick_pack: number
  key_changes: string | null
}

interface ProductUnits {
  id: string
  entry_id: string
  product_id: string
  date: string
  platform: string
  units_sold: number
}

type Platform = 'tiktok_shop' | 'amazon' | 'shopify'
type DateRange = '7d' | '30d' | 'month' | 'custom'

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'tiktok_shop', label: 'TikTok Shop' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'shopify', label: 'Shopify' },
]

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'

// ── Main Page ──────────────────────────────────────────────────────
export default function BiblePage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('tiktok_shop')
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [allUnits, setAllUnits] = useState<ProductUnits[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showAddDate, setShowAddDate] = useState(false)
  const [newDate, setNewDate] = useState('')
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

  // ── Date range calc ──
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    let s: Date, e: Date = now
    if (dateRange === '7d') {
      s = new Date(now); s.setDate(s.getDate() - 6)
    } else if (dateRange === '30d') {
      s = new Date(now); s.setDate(s.getDate() - 29)
    } else if (dateRange === 'month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      s = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1)
      e = customTo ? new Date(customTo) : now
    }
    return {
      startDate: s.toISOString().slice(0, 10),
      endDate: e.toISOString().slice(0, 10),
    }
  }, [dateRange, customFrom, customTo])

  // ── Load data ──
  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [{ data: prods }, { data: ents }, { data: units }] = await Promise.all([
      supabase.from('bible_products').select('*').eq('user_id', userId).eq('platform', platform).order('created_at'),
      supabase.from('bible_daily_entries').select('*').eq('user_id', userId).eq('platform', platform)
        .gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
      supabase.from('bible_product_daily_units').select('*').eq('user_id', userId).eq('platform', platform)
        .gte('date', startDate).lte('date', endDate),
    ])

    setProducts((prods || []) as Product[])
    setEntries((ents || []) as DailyEntry[])
    setAllUnits((units || []) as ProductUnits[])
    setLoading(false)
  }, [userId, platform, startDate, endDate, supabase])

  useEffect(() => { loadData() }, [loadData])

  // ── Save entry field (debounced) ──
  const saveEntry = useCallback((entryId: string, field: string, value: number | string) => {
    const key = `${entryId}-${field}`
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(async () => {
      await supabase.from('bible_daily_entries').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', entryId)
    }, 600)
  }, [supabase])

  // ── Save product units (debounced) ──
  const saveUnits = useCallback((entry: DailyEntry, productId: string, units: number) => {
    const key = `units-${entry.id}-${productId}`
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(async () => {
      await supabase.from('bible_product_daily_units').upsert({
        user_id: userId!,
        entry_id: entry.id,
        product_id: productId,
        date: entry.date,
        platform: entry.platform,
        units_sold: units,
      }, { onConflict: 'user_id,product_id,date,platform' })
    }, 600)
  }, [supabase, userId])

  // ── Add date entry ──
  const addDateEntry = async () => {
    if (!newDate || !userId) return
    const { data, error } = await supabase.from('bible_daily_entries').upsert({
      user_id: userId,
      date: newDate,
      platform,
    }, { onConflict: 'user_id,date,platform' }).select().single()
    if (!error && data) {
      setEntries(prev => [data as DailyEntry, ...prev.filter(e => e.date !== newDate)].sort((a, b) => b.date.localeCompare(a.date)))
    }
    setShowAddDate(false)
    setNewDate('')
  }

  // ── Update local entry state ──
  const updateEntry = (entryId: string, field: string, raw: string) => {
    const value = field === 'key_changes' ? raw : parseFloat(raw) || 0
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: value } : e))
    saveEntry(entryId, field, value)
  }

  // ── Update local units state ──
  const updateUnits = (entry: DailyEntry, productId: string, raw: string) => {
    const units = parseInt(raw) || 0
    setAllUnits(prev => {
      const existing = prev.find(u => u.entry_id === entry.id && u.product_id === productId)
      if (existing) {
        return prev.map(u => u.id === existing.id ? { ...u, units_sold: units } : u)
      }
      return [...prev, { id: `temp-${entry.id}-${productId}`, entry_id: entry.id, product_id: productId, date: entry.date, platform: entry.platform, units_sold: units }]
    })
    saveUnits(entry, productId, units)
  }

  // ── Calculated values ──
  const getUnitsForEntry = (entryId: string, productId: string) =>
    allUnits.find(u => u.entry_id === entryId && u.product_id === productId)?.units_sold || 0

  const getTotalUnits = (entryId: string) =>
    allUnits.filter(u => u.entry_id === entryId).reduce((s, u) => s + u.units_sold, 0)

  const getProductCost = (entryId: string) =>
    products.reduce((s, p) => s + getUnitsForEntry(entryId, p.id) * p.cogs, 0)

  const getProfit = (e: DailyEntry) => {
    const pc = getProductCost(e.id)
    return e.gross_revenue - e.refunds - e.platform_fee - e.commissions - e.gmv_max_ad_spend - e.ad_spend - pc - e.postage_pick_pack
  }

  const getAdSpendPct = (e: DailyEntry) =>
    e.gross_revenue > 0 ? (e.ad_spend / e.gross_revenue) * 100 : 0

  const getProfitPct = (e: DailyEntry) =>
    e.gross_revenue > 0 ? (getProfit(e) / e.gross_revenue) * 100 : 0

  // ── Totals ──
  const totals = useMemo(() => {
    const t = {
      gross_revenue: 0, refunds: 0, num_orders: 0, total_units: 0,
      platform_fee: 0, commissions: 0, gmv_max_ad_spend: 0, ad_spend: 0,
      product_cost: 0, postage_pick_pack: 0, profit: 0,
    }
    entries.forEach(e => {
      t.gross_revenue += e.gross_revenue
      t.refunds += e.refunds
      t.num_orders += e.num_orders
      t.total_units += getTotalUnits(e.id)
      t.platform_fee += e.platform_fee
      t.commissions += e.commissions
      t.gmv_max_ad_spend += e.gmv_max_ad_spend
      t.ad_spend += e.ad_spend
      t.product_cost += getProductCost(e.id)
      t.postage_pick_pack += e.postage_pick_pack
      t.profit += getProfit(e)
    })
    return t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, allUnits, products])

  // ── Chart data ──
  const chartData = useMemo(() =>
    [...entries].reverse().map(e => ({
      date: e.date.slice(5), // MM-DD
      'Gross Revenue': e.gross_revenue,
      'Net Profit': getProfit(e),
      'Ad Spend': e.ad_spend + e.gmv_max_ad_spend,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [entries, allUnits, products])

  // ── Editable cell component ──
  const Cell = ({ value, onChange, type = 'number', className = '', isCalculated = false }: {
    value: string | number; onChange?: (v: string) => void; type?: string; className?: string; isCalculated?: boolean
  }) => (
    <td className={`px-3 py-2 text-sm border-r border-white/[0.06] ${isCalculated ? 'bg-white/[0.02]' : ''} ${className}`}>
      {onChange ? (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent text-white text-right outline-none focus:ring-1 focus:ring-[#F24822]/40 rounded px-1 py-0.5 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={type === 'text' ? { textAlign: 'left' } : {}}
        />
      ) : (
        <span className="block text-right tabular-nums">{value}</span>
      )}
    </td>
  )

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📖</span> The Bible
          </h1>
          <p className="text-sm text-gray-500 mt-1">Daily Sales & P&L Tracker</p>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: '7d' as DateRange, label: '7 Days' },
            { key: '30d' as DateRange, label: '30 Days' },
            { key: 'month' as DateRange, label: 'This Month' },
            { key: 'custom' as DateRange, label: 'Custom' },
          ].map(r => (
            <button
              key={r.key}
              onClick={() => setDateRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                dateRange === r.key
                  ? 'bg-[#F24822]/20 text-[#F24822] border border-[#F24822]/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
              <span className="text-gray-500 text-xs">→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.07] pb-px">
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              platform === p.key
                ? 'border-[#F24822] text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <>
          {/* Chart */}
          {chartData.length > 1 && (
            <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9B0EE5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9B0EE5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gAd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F57B18" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F57B18" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#9ca3af' }}
                    formatter={(v) => [`€${fmt(Number(v || 0))}`, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Area type="monotone" dataKey="Gross Revenue" stroke="#9B0EE5" fill="url(#gRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Net Profit" stroke="#22c55e" fill="url(#gProfit)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Ad Spend" stroke="#F57B18" fill="url(#gAd)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Products bar */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            {products.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 group"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Package size={14} className="text-gray-500" />
                <span className="text-sm text-white font-medium">{p.name}</span>
                <span className="text-xs text-gray-500">€{fmt(p.cogs)}/unit</span>
                <button onClick={() => setEditProduct(p)} className="opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-white ml-1">
                  <Edit3 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition shrink-0"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <Plus size={14} /> Add Product
            </button>
          </div>

          {/* Add date button */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowAddDate(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white transition"
              style={{ background: 'rgba(242,72,34,0.15)', border: '1px solid rgba(242,72,34,0.3)' }}
            >
              <Calendar size={14} /> Add Day
            </button>
            {showAddDate && (
              <div className="flex items-center gap-2">
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white" />
                <button onClick={addDateEntry} className="px-3 py-1.5 rounded-lg text-sm bg-[#F24822] text-white">Add</button>
                <button onClick={() => setShowAddDate(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <th className="px-3 py-3 text-left font-medium sticky left-0 z-10" style={{ background: '#1a1a1a' }}>Date</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Gross Revenue</th>
                    <th className="px-3 py-3 text-right font-medium">Refunds</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap"># Orders</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap"># Units</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Platform Fee</th>
                    <th className="px-3 py-3 text-right font-medium">Commissions</th>
                    {platform === 'tiktok_shop' && (
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">GMV MAX</th>
                    )}
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Ad Spend</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Ad %</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Product Cost</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Postage+P&P</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">P/L</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">P/L %</th>
                    <th className="px-3 py-3 text-left font-medium whitespace-nowrap">Key Changes</th>
                    {products.map(p => (
                      <th key={p.id} className="px-3 py-3 text-right font-medium whitespace-nowrap">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={99} className="px-3 py-12 text-center text-gray-500 text-sm">
                        No entries yet. Click &quot;Add Day&quot; to get started.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {entries.map(e => {
                        const profit = getProfit(e)
                        const profitPct = getProfitPct(e)
                        const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400'
                        return (
                          <tr key={e.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition">
                            <td className="px-3 py-2 text-sm font-medium sticky left-0 z-10 whitespace-nowrap" style={{ background: '#141414' }}>
                              {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <Cell value={e.gross_revenue} onChange={v => updateEntry(e.id, 'gross_revenue', v)} />
                            <Cell value={e.refunds} onChange={v => updateEntry(e.id, 'refunds', v)} />
                            <Cell value={e.num_orders} onChange={v => updateEntry(e.id, 'num_orders', v)} />
                            <Cell value={getTotalUnits(e.id)} isCalculated />
                            <Cell value={e.platform_fee} onChange={v => updateEntry(e.id, 'platform_fee', v)} />
                            <Cell value={e.commissions} onChange={v => updateEntry(e.id, 'commissions', v)} />
                            {platform === 'tiktok_shop' && (
                              <Cell value={e.gmv_max_ad_spend} onChange={v => updateEntry(e.id, 'gmv_max_ad_spend', v)} />
                            )}
                            <Cell value={e.ad_spend} onChange={v => updateEntry(e.id, 'ad_spend', v)} />
                            <Cell value={fmtPct(getAdSpendPct(e))} isCalculated />
                            <Cell value={`€${fmt(getProductCost(e.id))}`} isCalculated />
                            <Cell value={e.postage_pick_pack} onChange={v => updateEntry(e.id, 'postage_pick_pack', v)} />
                            <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.06] bg-white/[0.02] font-semibold tabular-nums ${profitColor}`}>
                              €{fmt(profit)}
                            </td>
                            <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.06] bg-white/[0.02] tabular-nums ${profitColor}`}>
                              {fmtPct(profitPct)}
                            </td>
                            <Cell value={e.key_changes || ''} onChange={v => updateEntry(e.id, 'key_changes', v)} type="text" />
                            {products.map(p => (
                              <Cell
                                key={p.id}
                                value={getUnitsForEntry(e.id, p.id)}
                                onChange={v => updateUnits(e, p.id, v)}
                              />
                            ))}
                          </tr>
                        )
                      })}
                      {/* Totals row */}
                      <tr className="border-t-2 border-white/[0.1] font-semibold" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-3 text-sm sticky left-0 z-10" style={{ background: '#1a1a1a' }}>TOTAL</td>
                        <td className="px-3 py-3 text-sm text-right">€{fmt(totals.gross_revenue)}</td>
                        <td className="px-3 py-3 text-sm text-right">€{fmt(totals.refunds)}</td>
                        <td className="px-3 py-3 text-sm text-right">{totals.num_orders}</td>
                        <td className="px-3 py-3 text-sm text-right bg-white/[0.02]">{totals.total_units}</td>
                        <td className="px-3 py-3 text-sm text-right">€{fmt(totals.platform_fee)}</td>
                        <td className="px-3 py-3 text-sm text-right">€{fmt(totals.commissions)}</td>
                        {platform === 'tiktok_shop' && (
                          <td className="px-3 py-3 text-sm text-right">€{fmt(totals.gmv_max_ad_spend)}</td>
                        )}
                        <td className="px-3 py-3 text-sm text-right">€{fmt(totals.ad_spend)}</td>
                        <td className="px-3 py-3 text-sm text-right bg-white/[0.02]">
                          {fmtPct(totals.gross_revenue > 0 ? (totals.ad_spend / totals.gross_revenue) * 100 : 0)}
                        </td>
                        <td className="px-3 py-3 text-sm text-right bg-white/[0.02]">€{fmt(totals.product_cost)}</td>
                        <td className="px-3 py-3 text-sm text-right">€{fmt(totals.postage_pick_pack)}</td>
                        <td className={`px-3 py-3 text-sm text-right bg-white/[0.02] ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          €{fmt(totals.profit)}
                        </td>
                        <td className={`px-3 py-3 text-sm text-right bg-white/[0.02] ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmtPct(totals.gross_revenue > 0 ? (totals.profit / totals.gross_revenue) * 100 : 0)}
                        </td>
                        <td className="px-3 py-3 text-sm"></td>
                        {products.map(p => {
                          const total = entries.reduce((s, e) => s + getUnitsForEntry(e.id, p.id), 0)
                          return <td key={p.id} className="px-3 py-3 text-sm text-right">{total}</td>
                        })}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Product Modal */}
      {(showAddProduct || editProduct) && (
        <ProductModal
          product={editProduct}
          platform={platform}
          userId={userId!}
          supabase={supabase}
          onClose={() => { setShowAddProduct(false); setEditProduct(null) }}
          onSaved={() => { setShowAddProduct(false); setEditProduct(null); loadData() }}
        />
      )}
    </div>
  )
}

// ── Product Modal ──────────────────────────────────────────────────
function ProductModal({ product, platform, userId, supabase, onClose, onSaved }: {
  product: Product | null
  platform: string
  userId: string
  supabase: ReturnType<typeof createClient>
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name || '')
  const [sku, setSku] = useState(product?.sku || '')
  const [cogs, setCogs] = useState(product?.cogs?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (product) {
      await supabase.from('bible_products').update({ name: name.trim(), sku: sku.trim() || null, cogs: parseFloat(cogs) || 0 }).eq('id', product.id)
    } else {
      await supabase.from('bible_products').insert({ user_id: userId, name: name.trim(), sku: sku.trim() || null, cogs: parseFloat(cogs) || 0, platform })
    }
    onSaved()
  }

  const remove = async () => {
    if (!product) return
    setDeleting(true)
    await supabase.from('bible_product_daily_units').delete().eq('product_id', product.id)
    await supabase.from('bible_products').delete().eq('id', product.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Product Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vitamin C Serum"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">SKU (optional)</label>
            <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. VCS-001"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">COGS per unit (€) *</label>
            <input type="number" step="0.01" value={cogs} onChange={e => setCogs(e.target.value)} placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-6">
          <div>
            {product && (
              <button onClick={remove} disabled={deleting}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition">
                <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition">Cancel</button>
            <button onClick={save} disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}>
              {saving ? 'Saving…' : product ? 'Update' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

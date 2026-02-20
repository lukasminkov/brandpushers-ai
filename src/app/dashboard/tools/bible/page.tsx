'use client'
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, X, Trash2, Edit3, ChevronLeft, ChevronRight,
  Package, Settings, RefreshCw, Loader2, CheckCircle, Plug,
  ChevronDown, ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────
interface Variant {
  id: string
  bible_product_id: string
  sku_id: string | null
  sku_name: string
  cogs: number
  seller_sku: string | null
}

interface Product {
  id: string
  name: string
  sku: string | null
  cogs: number
  platform: string
  pick_pack_rate: number
  variants?: Variant[]
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
  pick_pack: number
  shipping_fee: number
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

interface VariantUnits {
  id: string
  entry_id: string
  variant_id: string
  product_id: string
  units_sold: number
}

interface BibleSettings {
  tiktok_shop_fee: number
  amazon_fee: number
  shopify_fee: number
  currency: string
  pick_pack_rate: number
}

const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF' },
  { code: 'SEK', symbol: 'kr', label: 'SEK (kr)' },
]

type Platform = 'tiktok_shop' | 'amazon' | 'shopify'
type DateRange = '7d' | '30d' | 'month' | 'custom'

interface CellAddr {
  rowIdx: number
  colKey: string
}

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'tiktok_shop', label: 'TikTok Shop' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'shopify', label: 'Shopify' },
]

const DEFAULT_SETTINGS: BibleSettings = {
  tiktok_shop_fee: 9,
  amazon_fee: 15,
  shopify_fee: 2.9,
  currency: 'USD',
  pick_pack_rate: 0,
}

const getCurrencySymbol = (settings: BibleSettings) =>
  CURRENCIES.find(c => c.code === settings.currency)?.symbol ?? '$'

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const loadSettings = (): BibleSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem('bible_settings')
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

const getPlatformFee = (settings: BibleSettings, platform: Platform) => {
  if (platform === 'tiktok_shop') return settings.tiktok_shop_fee
  if (platform === 'amazon') return settings.amazon_fee
  return settings.shopify_fee
}

// ── Floating Editor ────────────────────────────────────────────────
function FloatingEditor({ cellEl, initialValue, isText, onCommit, onNav }: {
  cellEl: HTMLTableCellElement
  initialValue: string
  isText: boolean
  onCommit: (val: string) => void
  onNav: (dir: 'next' | 'prev' | 'down' | 'up' | 'cancel') => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const committedRef = useRef(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    committedRef.current = false
    const rect = cellEl.getBoundingClientRect()
    setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    const el = inputRef.current
    if (el) { el.value = initialValue; el.focus(); el.select() }
  }, [cellEl, initialValue])

  useEffect(() => {
    const reposition = () => {
      const rect = cellEl.getBoundingClientRect()
      setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    }
    const scrollParent = cellEl.closest('.overflow-x-auto')
    scrollParent?.addEventListener('scroll', reposition)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      scrollParent?.removeEventListener('scroll', reposition)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [cellEl])

  const commit = useCallback(() => {
    if (committedRef.current) return
    committedRef.current = true
    onCommit(inputRef.current?.value ?? initialValue)
  }, [onCommit, initialValue])

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={isText ? 'text' : 'decimal'}
      onBlur={() => { commit() }}
      onKeyDown={e => {
        if (e.key === 'Tab') { e.preventDefault(); commit(); onNav(e.shiftKey ? 'prev' : 'next') }
        else if (e.key === 'Enter') { e.preventDefault(); commit(); onNav('down') }
        else if (e.key === 'Escape') { e.preventDefault(); committedRef.current = true; onNav('cancel') }
        else if (!isText && e.key === 'ArrowDown') { e.preventDefault(); commit(); onNav('down') }
        else if (!isText && e.key === 'ArrowUp') { e.preventDefault(); commit(); onNav('up') }
      }}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, height: pos.height, zIndex: 9999 }}
      className={`bg-[#141414] text-white outline-none px-3 py-2 text-sm ring-2 ring-[#F24822]/60 ${isText ? 'text-left' : 'text-right'} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
    />
  )
}

// ── Calendar Picker ────────────────────────────────────────────────
function CalendarPicker({ usedDates, onSelect, onClose }: {
  usedDates: Set<string>; onSelect: (date: string) => void; onClose: () => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const todayStr = today.toISOString().slice(0, 10)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayIdx = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else setViewMonth(m => m + 1) }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayIdx; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-5 w-[320px] shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-white">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayLabels.map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-500 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateStr === todayStr
            const isUsed = usedDates.has(dateStr)
            return (
              <button key={i} disabled={isUsed} onClick={() => onSelect(dateStr)}
                className={`w-full aspect-square rounded-lg text-xs font-medium transition-all duration-150 flex items-center justify-center ${isUsed ? 'text-gray-600 cursor-not-allowed opacity-40' : isToday ? 'bg-[#F24822] text-white hover:bg-[#F24822]/80 shadow-lg shadow-[#F24822]/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                {day}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Settings Modal ─────────────────────────────────────────────────
function SettingsModal({ settings, onSave, onClose }: {
  settings: BibleSettings; onSave: (s: BibleSettings) => void; onClose: () => void
}) {
  const [ts, setTs] = useState(settings.tiktok_shop_fee)
  const [am, setAm] = useState(settings.amazon_fee)
  const [sh, setSh] = useState(settings.shopify_fee)
  const [cur, setCur] = useState(settings.currency || 'USD')
  const [ppr, setPpr] = useState(settings.pick_pack_rate || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18} className="text-gray-400" /> Bible Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Currency</label>
            <select value={cur} onChange={e => setCur(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F24822]/50 transition appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-[#161616]">{c.label}</option>)}
            </select>
          </div>
          {[
            { label: 'TikTok Shop Platform Fee', value: ts, set: setTs },
            { label: 'Amazon Platform Fee', value: am, set: setAm },
            { label: 'Shopify Platform Fee', value: sh, set: setSh },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.1" value={f.value} onChange={e => f.set(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white text-right focus:outline-none focus:border-[#F24822]/50 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <span className="text-sm text-gray-400 font-medium">%</span>
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Default Pick & Pack Rate (per unit)</label>
            <input type="number" step="0.01" value={ppr} onChange={e => setPpr(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white text-right focus:outline-none focus:border-[#F24822]/50 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <p className="text-[10px] text-gray-600 mt-1">Auto-calculated from total units × rate</p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={() => onSave({ tiktok_shop_fee: ts, amazon_fee: am, shopify_fee: sh, currency: cur, pick_pack_rate: ppr })}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [allVariantUnits, setAllVariantUnits] = useState<VariantUnits[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<BibleSettings>(DEFAULT_SETTINGS)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  // TikTok connection state
  const [tiktokConnection, setTiktokConnection] = useState<{ id: string; shop_name: string | null; last_sync_at: string | null } | null>(null)
  const [tiktokSyncing, setTiktokSyncing] = useState(false)
  const [tiktokSyncMsg, setTiktokSyncMsg] = useState<string | null>(null)

  // Spreadsheet editing state
  const [editingCell, setEditingCell] = useState<CellAddr | null>(null)
  const [editValue, setEditValue] = useState('')
  const [activeCellEl, setActiveCellEl] = useState<HTMLTableCellElement | null>(null)
  const cellRegistry = useRef<Map<string, HTMLTableCellElement>>(new Map())
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const tableEndRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => { setSettings(loadSettings()) }, [])

  const saveSettings = (s: BibleSettings) => {
    setSettings(s)
    localStorage.setItem('bible_settings', JSON.stringify(s))
    setShowSettings(false)
  }

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  // ── Auth + check TikTok connection + resume sync if in progress ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('tiktok_connections').select('id, shop_name, last_sync_at, sync_status').eq('user_id', user.id).limit(1).single()
          .then(({ data }) => {
            if (data) {
              setTiktokConnection(data as { id: string; shop_name: string | null; last_sync_at: string | null })
              // Resume polling if sync is in progress
              if (data.sync_status === 'syncing') {
                setTiktokSyncing(true)
                setTiktokSyncMsg('Syncing orders from TikTok…')
              }
            }
          })
      }
    })
  }, [supabase])

  // ── Date range calc (moved up so poll can reference it) ──
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    let s: Date, e: Date = now
    if (dateRange === '7d') { s = new Date(now); s.setDate(s.getDate() - 6) }
    else if (dateRange === '30d') { s = new Date(now); s.setDate(s.getDate() - 29) }
    else if (dateRange === 'month') { s = new Date(now.getFullYear(), now.getMonth(), 1) }
    else { s = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1); e = customTo ? new Date(customTo) : now }
    return { startDate: s.toISOString().slice(0, 10), endDate: e.toISOString().slice(0, 10) }
  }, [dateRange, customFrom, customTo])

  // Poll sync progress — works for both new syncs and resumed syncs after page refresh
  const pollSyncProgress = useCallback(async () => {
    if (!tiktokConnection) return
    const { data } = await supabase
      .from('tiktok_connections')
      .select('sync_status, sync_error')
      .eq('id', tiktokConnection.id)
      .single()
    if (!data) return
    if (data.sync_status === 'error') {
      setTiktokSyncMsg(`Error: ${data.sync_error || 'Sync failed'}`)
      setTiktokSyncing(false)
      setTimeout(() => setTiktokSyncMsg(null), 5000)
      return
    }
    if (data.sync_status !== 'idle') {
      const { count } = await supabase
        .from('tiktok_orders')
        .select('*', { count: 'exact', head: true })
        .eq('connection_id', tiktokConnection.id)
      setTiktokSyncMsg(`Syncing orders… ${(count || 0).toLocaleString()} fetched`)
      setTimeout(pollSyncProgress, 3000)
      return
    }
    // Sync done — now populate Bible
    setTiktokSyncMsg('Populating Bible entries…')
    try {
      const populateRes = await fetch('/api/tiktok/bible-populate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: tiktokConnection.id, startDate, endDate, platformFeePercent: settings.tiktok_shop_fee }),
      })
      const popData = await populateRes.json()
      if (!popData.success) throw new Error(popData.error || 'Populate failed')
      setTiktokSyncMsg(`✓ Synced ${popData.daysUpdated || 0} days from TikTok`)
      loadData()
    } catch (err) {
      setTiktokSyncMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally {
      setTiktokSyncing(false)
      setTimeout(() => setTiktokSyncMsg(null), 8000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiktokConnection, supabase, startDate, endDate])

  // Start polling when tiktokSyncing becomes true (from button OR page load resume)
  useEffect(() => {
    if (tiktokSyncing && tiktokConnection) {
      pollSyncProgress()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiktokSyncing, tiktokConnection])

  const handleTikTokSync = async () => {
    if (!tiktokConnection) return
    setTiktokSyncing(true); setTiktokSyncMsg('Starting sync…')
    try {
      const syncRes = await fetch('/api/tiktok/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: tiktokConnection.id, syncType: 'all' }),
      })
      const syncData = await syncRes.json()
      if (syncData.error) throw new Error(syncData.error)
      // Polling is started by the useEffect above
    } catch (err) {
      setTiktokSyncMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      setTiktokSyncing(false)
      setTimeout(() => setTiktokSyncMsg(null), 5000)
    }
  }

  // (date range calc moved above pollSyncProgress)

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

    const productList = (prods || []) as Product[]

    // Load variants for each product
    if (productList.length > 0) {
      const { data: variants } = await supabase
        .from('bible_product_variants')
        .select('*')
        .in('bible_product_id', productList.map(p => p.id))

      const variantsByProduct = new Map<string, Variant[]>()
      for (const v of (variants || []) as Variant[]) {
        const list = variantsByProduct.get(v.bible_product_id) || []
        list.push(v)
        variantsByProduct.set(v.bible_product_id, list)
      }
      for (const p of productList) {
        p.variants = variantsByProduct.get(p.id) || []
      }

      // Load variant daily units
      const variantIds = (variants || []).map((v: Variant) => v.id)
      if (variantIds.length > 0) {
        const { data: vUnits } = await supabase
          .from('bible_variant_daily_units')
          .select('*')
          .eq('user_id', userId)
          .in('variant_id', variantIds)
          .gte('date', startDate).lte('date', endDate)
        setAllVariantUnits((vUnits || []) as VariantUnits[])
      } else {
        setAllVariantUnits([])
      }
    }

    setProducts(productList)
    setEntries((ents || []) as DailyEntry[])
    setAllUnits((units || []) as ProductUnits[])
    setLoading(false)
  }, [userId, platform, startDate, endDate, supabase])

  useEffect(() => { loadData() }, [loadData])

  // ── Editable column keys ──
  const editableColKeys = useMemo(() => {
    const keys: string[] = ['gross_revenue', 'refunds', 'num_orders']
    products.forEach(p => {
      const hasVariants = p.variants && p.variants.length > 0
      if (hasVariants) {
        p.variants!.forEach(v => keys.push(`vunits_${v.id}`))
      } else {
        keys.push(`units_${p.id}`)
      }
    })
    keys.push('commissions', 'ad_spend', 'shipping_fee', 'postage_pick_pack', 'key_changes')
    return keys
  }, [products, expandedProducts])

  const cellKey = (rowIdx: number, colKey: string) => `${rowIdx}:${colKey}`

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
        user_id: userId!, entry_id: entry.id, product_id: productId,
        date: entry.date, platform: entry.platform, units_sold: units,
      }, { onConflict: 'user_id,product_id,date,platform' })
    }, 600)
  }, [supabase, userId])

  // ── Save variant units (debounced) ──
  const saveVariantUnits = useCallback((entry: DailyEntry, variantId: string, productId: string, units: number) => {
    const key = `vunits-${entry.id}-${variantId}`
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(async () => {
      await supabase.from('bible_variant_daily_units').upsert({
        user_id: userId!, entry_id: entry.id, variant_id: variantId,
        product_id: productId, date: entry.date, platform: entry.platform, units_sold: units,
      }, { onConflict: 'entry_id,variant_id' })
    }, 600)
  }, [supabase, userId])

  // ── Add date entry ──
  const addDateEntry = async (dateStr: string) => {
    if (!userId) return
    setShowCalendar(false)
    const { data, error } = await supabase.from('bible_daily_entries').upsert({
      user_id: userId, date: dateStr, platform, platform_fee: 0, ad_spend: 0, gmv_max_ad_spend: 0, shipping_fee: 0,
    }, { onConflict: 'user_id,date,platform' }).select().single()
    if (!error && data) {
      const newEntry = data as DailyEntry
      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== dateStr)
        return [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
      })
    }
  }

  // ── Commit edit ──
  const commitEdit = useCallback((addr: CellAddr | null, val: string) => {
    if (!addr) return
    const entry = entries[addr.rowIdx]
    if (!entry) return

    if (addr.colKey.startsWith('vunits_')) {
      const variantId = addr.colKey.replace('vunits_', '')
      const units = parseInt(val) || 0
      // Find parent product
      const variant = products.flatMap(p => p.variants || []).find(v => v.id === variantId)
      if (variant) {
        setAllVariantUnits(prev => {
          const existing = prev.find(u => u.entry_id === entry.id && u.variant_id === variantId)
          if (existing) return prev.map(u => u.variant_id === variantId && u.entry_id === entry.id ? { ...u, units_sold: units } : u)
          return [...prev, { id: `temp-${entry.id}-${variantId}`, entry_id: entry.id, variant_id: variantId, product_id: variant.bible_product_id, units_sold: units }]
        })
        saveVariantUnits(entry, variantId, variant.bible_product_id, units)
      }
    } else if (addr.colKey.startsWith('units_')) {
      const productId = addr.colKey.replace('units_', '')
      const units = parseInt(val) || 0
      setAllUnits(prev => {
        const existing = prev.find(u => u.entry_id === entry.id && u.product_id === productId)
        if (existing) return prev.map(u => u.id === existing.id ? { ...u, units_sold: units } : u)
        return [...prev, { id: `temp-${entry.id}-${productId}`, entry_id: entry.id, product_id: productId, date: entry.date, platform: entry.platform, units_sold: units }]
      })
      saveUnits(entry, productId, units)
    } else if (addr.colKey === 'key_changes') {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, key_changes: val } : e))
      saveEntry(entry.id, 'key_changes', val)
    } else {
      const numVal = parseFloat(val) || 0
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, [addr.colKey]: numVal } : e))
      saveEntry(entry.id, addr.colKey, numVal)
      if (addr.colKey === 'gross_revenue') {
        const feePct = getPlatformFee(settings, platform)
        const autoFee = parseFloat((numVal * feePct / 100).toFixed(2))
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, platform_fee: autoFee } : e))
        saveEntry(entry.id, 'platform_fee', autoFee)
      }
    }
  }, [entries, saveEntry, saveUnits, saveVariantUnits, settings, platform, products])

  // ── Start editing ──
  const startEdit = useCallback((rowIdx: number, colKey: string, tdEl?: HTMLTableCellElement) => {
    const entry = entries[rowIdx]
    if (!entry) return
    let val: string
    if (colKey.startsWith('vunits_')) {
      const variantId = colKey.replace('vunits_', '')
      const u = allVariantUnits.find(u => u.entry_id === entry.id && u.variant_id === variantId)?.units_sold || 0
      val = u === 0 ? '' : String(u)
    } else if (colKey.startsWith('units_')) {
      const productId = colKey.replace('units_', '')
      const u = allUnits.find(u => u.entry_id === entry.id && u.product_id === productId)?.units_sold || 0
      val = u === 0 ? '' : String(u)
    } else if (colKey === 'key_changes') {
      val = entry.key_changes || ''
    } else {
      const n = (entry as unknown as Record<string, unknown>)[colKey] as number || 0
      val = n === 0 ? '' : String(n)
    }
    const el = tdEl || cellRegistry.current.get(cellKey(rowIdx, colKey))
    if (!el) return
    setEditingCell({ rowIdx, colKey }); setEditValue(val); setActiveCellEl(el)
  }, [entries, allUnits, allVariantUnits])

  // ── Refs for stable callbacks ──
  const entriesRef = useRef(entries); entriesRef.current = entries
  const editableColKeysRef = useRef(editableColKeys); editableColKeysRef.current = editableColKeys
  const startEditRef = useRef(startEdit); startEditRef.current = startEdit
  const commitEditRef = useRef(commitEdit); commitEditRef.current = commitEdit

  const navigateCell = useCallback((fromRow: number, fromCol: string, direction: 'next' | 'prev' | 'down' | 'up') => {
    const cols = editableColKeysRef.current
    const colIdx = cols.indexOf(fromCol)
    let targetRow = fromRow, targetColIdx = colIdx
    if (direction === 'next') { targetColIdx++; if (targetColIdx >= cols.length) { targetColIdx = 0; targetRow++ } }
    else if (direction === 'prev') { targetColIdx--; if (targetColIdx < 0) { targetColIdx = cols.length - 1; targetRow-- } }
    else if (direction === 'down') targetRow++
    else if (direction === 'up') targetRow--
    if (targetRow < 0 || targetRow >= entriesRef.current.length) { setEditingCell(null); setActiveCellEl(null); return }
    requestAnimationFrame(() => { startEditRef.current(targetRow, cols[targetColIdx]) })
  }, [])

  // ── Calculated values ──
  const getUnitsForEntry = (entryId: string, productId: string) =>
    allUnits.find(u => u.entry_id === entryId && u.product_id === productId)?.units_sold || 0
  const getVariantUnitsForEntry = (entryId: string, variantId: string) =>
    allVariantUnits.find(u => u.entry_id === entryId && u.variant_id === variantId)?.units_sold || 0
  const getTotalUnits = (entryId: string) => {
    // Sum product-level units (products without variants)
    const productUnits = allUnits.filter(u => u.entry_id === entryId).reduce((s, u) => s + u.units_sold, 0)
    // Sum variant-level units (products with variants)
    const variantUnits = allVariantUnits.filter(u => u.entry_id === entryId).reduce((s, u) => s + u.units_sold, 0)
    return productUnits + variantUnits
  }

  const getProductCost = (entryId: string) => {
    let cost = 0
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        // Use per-variant COGS
        for (const v of p.variants) {
          const units = getVariantUnitsForEntry(entryId, v.id)
          cost += units * (v.cogs || p.cogs)
        }
        // Also add units tracked at product level but not variant level
        const variantTotal = p.variants.reduce((s, v) => s + getVariantUnitsForEntry(entryId, v.id), 0)
        const productTotal = getUnitsForEntry(entryId, p.id)
        const remainder = productTotal - variantTotal
        if (remainder > 0) cost += remainder * p.cogs
      } else {
        cost += getUnitsForEntry(entryId, p.id) * p.cogs
      }
    }
    return cost
  }

  const getPickPackCost = (entryId: string) => {
    const totalUnits = getTotalUnits(entryId)
    return totalUnits * (settings.pick_pack_rate || 0)
  }

  const getAdSpend = (e: DailyEntry) => e.ad_spend + e.gmv_max_ad_spend

  const getProfit = (e: DailyEntry) => {
    const pc = getProductCost(e.id)
    const pp = getPickPackCost(e.id)
    return e.gross_revenue - e.refunds - e.platform_fee - e.commissions - getAdSpend(e) - pc - (e.shipping_fee || 0) - e.postage_pick_pack - pp
  }

  const getAdSpendPct = (e: DailyEntry) => e.gross_revenue > 0 ? (getAdSpend(e) / e.gross_revenue) * 100 : 0
  const getProfitPct = (e: DailyEntry) => e.gross_revenue > 0 ? (getProfit(e) / e.gross_revenue) * 100 : 0

  const usedDates = useMemo(() => new Set(entries.map(e => e.date)), [entries])

  // ── Totals ──
  const totals = useMemo(() => {
    const t = {
      gross_revenue: 0, refunds: 0, num_orders: 0, total_units: 0,
      platform_fee: 0, commissions: 0, ad_spend: 0,
      product_cost: 0, shipping_fee: 0, postage_pick_pack: 0, pick_pack: 0, profit: 0,
    }
    entries.forEach(e => {
      t.gross_revenue += e.gross_revenue; t.refunds += e.refunds; t.num_orders += e.num_orders
      t.total_units += getTotalUnits(e.id); t.platform_fee += e.platform_fee; t.commissions += e.commissions
      t.ad_spend += getAdSpend(e); t.product_cost += getProductCost(e.id)
      t.shipping_fee += (e.shipping_fee || 0); t.postage_pick_pack += e.postage_pick_pack
      t.pick_pack += getPickPackCost(e.id); t.profit += getProfit(e)
    })
    return t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, allUnits, allVariantUnits, products, settings])

  // ── Chart data — revenue vs total costs vs net profit ──
  const chartData = useMemo(() =>
    [...entries].reverse().map(e => ({
      date: e.date.slice(5),
      Revenue: e.gross_revenue,
      Costs: e.gross_revenue - getProfit(e),
      Profit: getProfit(e),
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [entries, allUnits, allVariantUnits, products, settings])

  const cs = getCurrencySymbol(settings)

  // ── Floating editor callbacks ──
  const editingCellRef = useRef(editingCell); editingCellRef.current = editingCell
  const navigateCellRef = useRef(navigateCell); navigateCellRef.current = navigateCell

  const handleFloatingCommit = useCallback((val: string) => {
    const ec = editingCellRef.current
    if (ec) commitEditRef.current(ec, val)
    setEditingCell(null); setActiveCellEl(null)
  }, [])

  const handleFloatingNav = useCallback((dir: 'next' | 'prev' | 'down' | 'up' | 'cancel') => {
    const ec = editingCellRef.current
    if (!ec) return
    if (dir === 'cancel') { setEditingCell(null); setActiveCellEl(null); return }
    navigateCellRef.current(ec.rowIdx, ec.colKey, dir)
  }, [])

  const registerCell = useCallback((rowIdx: number, colKey: string) => (el: HTMLTableCellElement | null) => {
    if (el) cellRegistry.current.set(cellKey(rowIdx, colKey), el)
  }, [])

  const handleCellClick = useCallback((rowIdx: number, colKey: string, e: React.MouseEvent<HTMLTableCellElement>) => {
    startEditRef.current(rowIdx, colKey, e.currentTarget)
  }, [])

  const isCellEditing = (rowIdx: number, colKey: string) =>
    editingCell?.rowIdx === rowIdx && editingCell?.colKey === colKey

  // ── Count total header columns for colSpan ──
  // Count product columns: products with variants show variant cols only, others show 1 col
  const productColCount = products.reduce((s, p) => {
    const hasVariants = p.variants && p.variants.length > 0
    return s + (hasVariants ? p.variants!.length : 1)
  }, 0)
  const totalCols = 17 + productColCount

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><span className="text-3xl">📖</span> The Bible</h1>
          <p className="text-sm text-gray-500 mt-1">Daily Sales & P&L Tracker</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: '7d' as DateRange, label: '7 Days' },
            { key: '30d' as DateRange, label: '30 Days' },
            { key: 'month' as DateRange, label: 'This Month' },
            { key: 'custom' as DateRange, label: 'Custom' },
          ]).map(r => (
            <button key={r.key} onClick={() => setDateRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${dateRange === r.key ? 'bg-[#F24822]/20 text-[#F24822] border border-[#F24822]/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}>
              {r.label}
            </button>
          ))}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
              <span className="text-gray-500 text-xs">→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
            </div>
          )}
          {platform === 'tiktok_shop' && tiktokConnection && (
            <button onClick={handleTikTokSync} disabled={tiktokSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ml-1 disabled:opacity-50"
              style={{ background: 'rgba(242,72,34,0.12)', border: '1px solid rgba(242,72,34,0.2)', color: '#F24822' }}>
              {tiktokSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Sync TikTok
            </button>
          )}
          {platform === 'tiktok_shop' && !tiktokConnection && !loading && (
            <Link href="/dashboard/integrations" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 bg-white/5 border border-white/10 hover:border-white/20 transition ml-1">
              <Plug size={12} /> Connect TikTok
            </Link>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition ml-1" title="Bible Settings">
            <Settings size={14} />
          </button>
        </div>
      </div>
      {/* Sync status bar — fixed height so layout doesn't shift */}
      <div className="h-6 flex items-center">
        {tiktokSyncing && (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-[#F24822] rounded-full animate-pulse" style={{ width: '100%', animationDuration: '2s' }} />
            </div>
            <span className="text-[11px] text-gray-400 whitespace-nowrap">{tiktokSyncMsg || 'Syncing…'}</span>
          </div>
        )}
        {!tiktokSyncing && tiktokSyncMsg && (
          <div className={`flex items-center gap-1.5 text-[11px] ${tiktokSyncMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400/70'}`}>
            {!tiktokSyncMsg.startsWith('Error') && <CheckCircle size={11} />}
            <span>{tiktokSyncMsg}</span>
          </div>
        )}
      </div>

      {/* Platform tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.07] pb-px">
        {PLATFORMS.map(p => (
          <button key={p.key} onClick={() => setPlatform(p.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${platform === p.key ? 'border-[#F24822] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <>
          {/* Chart — Revenue vs Costs vs Profit */}
          {chartData.length > 1 && (
            <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9B0EE5" stopOpacity={0.3} /><stop offset="95%" stopColor="#9B0EE5" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${cs}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#9ca3af' }} formatter={(v) => [`${cs}${fmt(Number(v || 0))}`, undefined]} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#9B0EE5" fill="url(#gRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Costs" stroke="#ef4444" fill="url(#gCost)" strokeWidth={1.5} strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="Profit" stroke="#22c55e" fill="url(#gProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Products bar */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            {products.map(p => (
              <div key={p.id} className="flex flex-col shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl group transition-all hover:border-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Package size={14} className="text-gray-500" />
                  <span className="text-sm text-white font-medium">{p.name}</span>
                  {p.variants && p.variants.length > 0 && (
                    <button onClick={() => toggleProductExpand(p.id)} className="text-gray-500 hover:text-white transition" title="Show variants">
                      {expandedProducts.has(p.id) ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
                      <span className="text-[10px] ml-0.5">{p.variants.length} SKUs</span>
                    </button>
                  )}
                  <span className="text-xs text-gray-500">{cs}{fmt(p.cogs)}/unit</span>
                  <button onClick={() => setEditProduct(p)} className="opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-white ml-1"><Edit3 size={12} /></button>
                </div>
                {/* Variant chips when expanded */}
                {expandedProducts.has(p.id) && p.variants && p.variants.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5 ml-4">
                    {p.variants.map(v => (
                      <div key={v.id} className="px-2 py-1 rounded-lg text-[10px] text-gray-400" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {v.sku_name} — {cs}{fmt(v.cogs)}/unit
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition shrink-0"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Plus size={14} /> Add Product
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Revenue', value: `${cs}${fmt(totals.gross_revenue)}`, color: '#9B0EE5' },
              { label: 'Total Costs', value: `${cs}${fmt(totals.gross_revenue - totals.profit)}`, color: '#ef4444' },
              { label: 'Net Profit', value: `${cs}${fmt(totals.profit)}`, color: totals.profit >= 0 ? '#22c55e' : '#ef4444' },
              { label: 'Margin', value: fmtPct(totals.gross_revenue > 0 ? (totals.profit / totals.gross_revenue) * 100 : 0), color: totals.profit >= 0 ? '#22c55e' : '#ef4444' },
              { label: 'Orders', value: String(totals.num_orders), color: '#6b7280' },
            ].map(c => (
              <div key={c.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</p>
                <p className="text-lg font-bold mt-0.5 tabular-nums" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Data Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <th className="px-3 py-3 text-left font-medium align-bottom sticky left-0 z-10 whitespace-nowrap" style={{ background: '#1a1a1a' }}>Date</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Gross Rev</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom">Refunds</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap"># Orders</th>
                    {products.map(p => {
                      const hasVariants = p.variants && p.variants.length > 0
                      return (
                        <React.Fragment key={p.id}>
                          {hasVariants ? (
                            // Product with variants: show variant columns only (no parent units col)
                            p.variants!.map((v, vi) => (
                              <th key={v.id} className="px-2 pt-1 pb-2 text-right font-normal whitespace-nowrap align-bottom"
                                style={{ background: 'rgba(155,14,229,0.04)' }}>
                                {vi === 0 && (
                                  <span className="block text-[9px] text-gray-500 font-medium uppercase tracking-wider mb-0.5 text-left">{p.name}</span>
                                )}
                                <span className="text-[10px] text-purple-400/70">{v.sku_name}</span>
                                <span className="block text-[8px] text-gray-600 font-normal normal-case">units</span>
                              </th>
                            ))
                          ) : (
                            // Product without variants: single units column
                            <th className="px-3 pt-2 pb-1 text-right font-medium whitespace-nowrap align-bottom">
                              <span className="text-xs uppercase tracking-wider">{p.name}</span>
                              <span className="block text-[9px] text-gray-600 font-normal normal-case leading-tight">units</span>
                            </th>
                          )}
                        </React.Fragment>
                      )
                    })}
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Total Units</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Platform Fee</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom">Commissions</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Ad Spend</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Ad %</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">COGS</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Shipping</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Postage</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Pick&Pack</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">Net P/L</th>
                    <th className="px-3 py-3 text-right font-medium align-bottom whitespace-nowrap">P/L %</th>
                    <th className="px-3 py-3 text-left font-medium align-bottom whitespace-nowrap">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={totalCols} className="px-3 py-16 text-center text-gray-500 text-sm">No entries yet. Click <span className="text-white font-medium">+</span> below to add your first day.</td></tr>
                  ) : (
                    <>
                      {entries.map((e, rowIdx) => {
                        const profit = getProfit(e)
                        const profitPct = getProfitPct(e)
                        const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400'

                        const EC = (colKey: string, value: number | string, isText = false) => {
                          const editing = isCellEditing(rowIdx, colKey)
                          const display = isText ? (value || '—') : (typeof value === 'number' ? (value === 0 ? '—' : fmt(value)) : String(value))
                          return (
                            <td key={colKey} ref={registerCell(rowIdx, colKey)} onClick={(ev) => handleCellClick(rowIdx, colKey, ev)}
                              className={`px-3 py-2 text-sm border-r border-white/[0.04] cursor-pointer transition-colors duration-100 ${isText ? 'text-left' : 'text-right'} ${editing ? 'ring-2 ring-[#F24822]/40 ring-inset' : 'hover:bg-white/[0.04]'}`}>
                              <span className={`block tabular-nums ${typeof value === 'number' && value === 0 ? 'text-gray-600' : 'text-white'}`}>{display}</span>
                            </td>
                          )
                        }

                        const CalcCell = ({ value, prefix = '', color }: { value: string | number; prefix?: string; color?: string }) => {
                          const display = typeof value === 'number' ? (value === 0 ? '—' : `${prefix}${fmt(value)}`) : value
                          return <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.04] bg-white/[0.015] tabular-nums ${color || 'text-gray-400'}`}>{display}</td>
                        }

                        return (
                          <tr key={e.id} className="border-t border-white/[0.04] transition-colors duration-100">
                            <td className="px-3 py-2 text-sm font-medium sticky left-0 z-10 whitespace-nowrap" style={{ background: '#141414' }}>
                              <span className="text-white">{fmtDate(e.date)}</span>
                            </td>
                            {EC('gross_revenue', e.gross_revenue)}
                            {EC('refunds', e.refunds)}
                            {EC('num_orders', e.num_orders)}
                            {products.map(p => {
                              const hasVariants = p.variants && p.variants.length > 0
                              return (
                                <React.Fragment key={p.id}>
                                  {hasVariants ? (
                                    // Show variant unit cells only
                                    p.variants!.map(v => (
                                      <td key={v.id} ref={registerCell(rowIdx, `vunits_${v.id}`)}
                                        onClick={(ev) => handleCellClick(rowIdx, `vunits_${v.id}`, ev)}
                                        className={`px-2 py-2 text-sm text-right border-r border-white/[0.04] cursor-pointer transition-colors duration-100 ${isCellEditing(rowIdx, `vunits_${v.id}`) ? 'ring-2 ring-[#F24822]/40 ring-inset' : 'hover:bg-white/[0.04]'}`}
                                        style={{ background: 'rgba(155,14,229,0.02)' }}>
                                        <span className={`block tabular-nums text-xs ${getVariantUnitsForEntry(e.id, v.id) === 0 ? 'text-gray-600' : 'text-purple-300'}`}>
                                          {getVariantUnitsForEntry(e.id, v.id) === 0 ? '—' : getVariantUnitsForEntry(e.id, v.id)}
                                        </span>
                                      </td>
                                    ))
                                  ) : (
                                    EC(`units_${p.id}`, getUnitsForEntry(e.id, p.id))
                                  )}
                                </React.Fragment>
                              )
                            })}
                            <CalcCell value={getTotalUnits(e.id)} />
                            <CalcCell value={e.platform_fee} prefix={cs} />
                            {EC('commissions', e.commissions)}
                            {EC('ad_spend', getAdSpend(e))}
                            <CalcCell value={fmtPct(getAdSpendPct(e))} />
                            <CalcCell value={getProductCost(e.id)} prefix={cs} />
                            {EC('shipping_fee', e.shipping_fee || 0)}
                            {EC('postage_pick_pack', e.postage_pick_pack)}
                            <CalcCell value={getPickPackCost(e.id)} prefix={cs} />
                            <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.04] bg-white/[0.015] font-bold tabular-nums ${profitColor}`}>
                              {profit === 0 ? '—' : `${cs}${fmt(profit)}`}
                            </td>
                            <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.04] bg-white/[0.015] font-bold tabular-nums ${profitColor}`}>
                              {profit === 0 ? '—' : fmtPct(profitPct)}
                            </td>
                            {EC('key_changes', e.key_changes || '', true)}
                          </tr>
                        )
                      })}

                      {/* Totals row */}
                      <tr className="border-t-2 border-white/[0.1] font-semibold" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-3 text-sm sticky left-0 z-10 text-gray-300" style={{ background: '#1a1a1a' }}>TOTAL</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{cs}{fmt(totals.gross_revenue)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{cs}{fmt(totals.refunds)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{totals.num_orders}</td>
                        {products.map(p => {
                          const hasVariants = p.variants && p.variants.length > 0
                          return (
                            <React.Fragment key={p.id}>
                              {hasVariants ? (
                                p.variants!.map(v => {
                                  const vTotal = entries.reduce((s, e) => s + getVariantUnitsForEntry(e.id, v.id), 0)
                                  return <td key={v.id} className="px-2 py-3 text-sm text-right tabular-nums text-purple-300/70" style={{ background: 'rgba(155,14,229,0.04)' }}>{vTotal}</td>
                                })
                              ) : (
                                <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{entries.reduce((s, e) => s + getUnitsForEntry(e.id, p.id), 0)}</td>
                              )}
                            </React.Fragment>
                          )
                        })}
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">{totals.total_units}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">{cs}{fmt(totals.platform_fee)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{cs}{fmt(totals.commissions)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{cs}{fmt(totals.ad_spend)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">
                          {fmtPct(totals.gross_revenue > 0 ? (totals.ad_spend / totals.gross_revenue) * 100 : 0)}
                        </td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">{cs}{fmt(totals.product_cost)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{cs}{fmt(totals.shipping_fee)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{cs}{fmt(totals.postage_pick_pack)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">{cs}{fmt(totals.pick_pack)}</td>
                        <td className={`px-3 py-3 text-sm text-right tabular-nums font-bold bg-white/[0.015] ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {cs}{fmt(totals.profit)}
                        </td>
                        <td className={`px-3 py-3 text-sm text-right tabular-nums font-bold bg-white/[0.015] ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmtPct(totals.gross_revenue > 0 ? (totals.profit / totals.gross_revenue) * 100 : 0)}
                        </td>
                        <td className="px-3 py-3 text-sm"></td>
                      </tr>
                    </>
                  )}

                  {/* Add row */}
                  <tr ref={tableEndRef} onClick={() => setShowCalendar(true)}
                    className="border-t border-dashed border-white/[0.08] cursor-pointer group/add transition-colors duration-150 hover:bg-white/[0.03]">
                    <td colSpan={totalCols} className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 group-hover/add:text-[#F24822] transition-colors duration-150">
                        <div className="w-7 h-7 rounded-lg border border-dashed border-white/[0.1] group-hover/add:border-[#F24822]/40 flex items-center justify-center transition-all duration-150 group-hover/add:bg-[#F24822]/10">
                          <Plus size={14} />
                        </div>
                        <span className="text-sm font-medium">Add Day</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showCalendar && <CalendarPicker usedDates={usedDates} onSelect={addDateEntry} onClose={() => setShowCalendar(false)} />}
      {showSettings && <SettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
      {(showAddProduct || editProduct) && (
        <ProductModal product={editProduct} platform={platform} userId={userId!} supabase={supabase}
          onClose={() => { setShowAddProduct(false); setEditProduct(null) }}
          onSaved={() => { setShowAddProduct(false); setEditProduct(null); loadData() }} />
      )}
      {editingCell && activeCellEl && (
        <FloatingEditor key={`${editingCell.rowIdx}-${editingCell.colKey}`} cellEl={activeCellEl}
          initialValue={editValue} isText={editingCell.colKey === 'key_changes'}
          onCommit={handleFloatingCommit} onNav={handleFloatingNav} />
      )}
    </div>
  )
}

// ── Product Modal (with variant COGS editing) ──────────────────────
function ProductModal({ product, platform, userId, supabase, onClose, onSaved }: {
  product: Product | null; platform: string; userId: string
  supabase: ReturnType<typeof createClient>; onClose: () => void; onSaved: () => void
}) {
  const [name, setName] = useState(product?.name || '')
  const [sku, setSku] = useState(product?.sku || '')
  const [cogs, setCogs] = useState(product?.cogs?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [variants, setVariants] = useState<Variant[]>(product?.variants || [])
  const [newVariantName, setNewVariantName] = useState('')

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (product) {
      await supabase.from('bible_products').update({
        name: name.trim(), sku: sku.trim() || null, cogs: parseFloat(cogs) || 0,
      }).eq('id', product.id)

      // Update variant COGS
      for (const v of variants) {
        await supabase.from('bible_product_variants').update({ cogs: v.cogs, sku_name: v.sku_name }).eq('id', v.id)
      }
    } else {
      const { data: newProd } = await supabase.from('bible_products').insert({
        user_id: userId, name: name.trim(), sku: sku.trim() || null, cogs: parseFloat(cogs) || 0, platform,
      }).select('id').single()

      // Create new variants
      if (newProd) {
        for (const v of variants) {
          await supabase.from('bible_product_variants').insert({
            bible_product_id: newProd.id, sku_name: v.sku_name, cogs: v.cogs,
          })
        }
      }
    }
    onSaved()
  }

  const remove = async () => {
    if (!product) return
    setDeleting(true)
    await supabase.from('bible_variant_daily_units').delete().eq('product_id', product.id)
    await supabase.from('bible_product_variants').delete().eq('bible_product_id', product.id)
    await supabase.from('bible_product_daily_units').delete().eq('product_id', product.id)
    await supabase.from('bible_products').delete().eq('id', product.id)
    onSaved()
  }

  const addVariant = () => {
    if (!newVariantName.trim()) return
    setVariants(prev => [...prev, {
      id: `new-${Date.now()}`, bible_product_id: product?.id || '', sku_id: null,
      sku_name: newVariantName.trim(), cogs: parseFloat(cogs) || 0, seller_sku: null,
    }])
    setNewVariantName('')
  }

  const removeVariant = async (v: Variant) => {
    if (!v.id.startsWith('new-') && product) {
      await supabase.from('bible_variant_daily_units').delete().eq('variant_id', v.id)
      await supabase.from('bible_product_variants').delete().eq('id', v.id)
    }
    setVariants(prev => prev.filter(x => x.id !== v.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Product Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SEDLAK Blue Light Blockers"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">SKU (optional)</label>
            <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. BLB-001"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Default COGS per unit *</label>
            <input type="number" step="0.01" value={cogs} onChange={e => setCogs(e.target.value)} placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>

          {/* Variants */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Variants / SKUs</label>
            {variants.length > 0 && (
              <div className="space-y-2 mb-3">
                {variants.map(v => (
                  <div key={v.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <input value={v.sku_name} onChange={e => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, sku_name: e.target.value } : x))}
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none" placeholder="Variant name" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500">COGS</span>
                      <input type="number" step="0.01" value={v.cogs}
                        onChange={e => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, cogs: parseFloat(e.target.value) || 0 } : x))}
                        className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <button onClick={() => removeVariant(v)} className="text-gray-500 hover:text-red-400 transition"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input value={newVariantName} onChange={e => setNewVariantName(e.target.value)} placeholder="Add variant (e.g. Vintage)"
                onKeyDown={e => e.key === 'Enter' && addVariant()}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition" />
              <button onClick={addVariant} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-6">
          <div>
            {product && (
              <button onClick={remove} disabled={deleting} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition">
                <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition">Cancel</button>
            <button onClick={save} disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-40 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}>
              {saving ? 'Saving…' : product ? 'Update' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

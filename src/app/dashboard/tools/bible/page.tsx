'use client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, X, Trash2, Edit3, ChevronLeft, ChevronRight,
  Package, Settings,
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

interface BibleSettings {
  tiktok_shop_fee: number
  amazon_fee: number
  shopify_fee: number
}

type Platform = 'tiktok_shop' | 'amazon' | 'shopify'
type DateRange = '7d' | '30d' | 'month' | 'custom'

// Cell address for spreadsheet navigation
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
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const dash = (n: number) => n === 0 ? '—' : fmt(n)
const dashInt = (n: number) => n === 0 ? '—' : String(n)

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

// ── Calendar Picker ────────────────────────────────────────────────
function CalendarPicker({ usedDates, onSelect, onClose }: {
  usedDates: Set<string>
  onSelect: (date: string) => void
  onClose: () => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const todayStr = today.toISOString().slice(0, 10)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  // Monday = 0
  const firstDayIdx = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayIdx; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rounded-2xl p-5 w-[320px] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-white">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayLabels.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateStr === todayStr
            const isUsed = usedDates.has(dateStr)
            return (
              <button
                key={i}
                disabled={isUsed}
                onClick={() => onSelect(dateStr)}
                className={`
                  w-full aspect-square rounded-lg text-xs font-medium transition-all duration-150
                  flex items-center justify-center
                  ${isUsed
                    ? 'text-gray-600 cursor-not-allowed opacity-40'
                    : isToday
                      ? 'bg-[#F24822] text-white hover:bg-[#F24822]/80 shadow-lg shadow-[#F24822]/20'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Settings Modal ─────────────────────────────────────────────────
function SettingsModal({ settings, onSave, onClose }: {
  settings: BibleSettings
  onSave: (s: BibleSettings) => void
  onClose: () => void
}) {
  const [ts, setTs] = useState(settings.tiktok_shop_fee)
  const [am, setAm] = useState(settings.amazon_fee)
  const [sh, setSh] = useState(settings.shopify_fee)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings size={18} className="text-gray-400" /> Bible Settings
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'TikTok Shop Platform Fee', value: ts, set: setTs },
            { label: 'Amazon Platform Fee', value: am, set: setAm },
            { label: 'Shopify Platform Fee', value: sh, set: setSh },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={f.value}
                  onChange={e => f.set(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white text-right focus:outline-none focus:border-[#F24822]/50 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-gray-400 font-medium">%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={() => onSave({ tiktok_shop_fee: ts, amazon_fee: am, shopify_fee: sh })}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
          >
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
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<BibleSettings>(DEFAULT_SETTINGS)

  // Spreadsheet editing state
  const [editingCell, setEditingCell] = useState<CellAddr | null>(null)
  const [editValue, setEditValue] = useState('')
  const [preEditValue, setPreEditValue] = useState('')
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const isNavigating = useRef(false)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const tableEndRef = useRef<HTMLTableRowElement>(null)

  // Load settings from localStorage
  useEffect(() => { setSettings(loadSettings()) }, [])

  const saveSettings = (s: BibleSettings) => {
    setSettings(s)
    localStorage.setItem('bible_settings', JSON.stringify(s))
    setShowSettings(false)
  }

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

  // ── Editable column keys for tab navigation ──
  const editableColKeys = useMemo(() => {
    const keys: string[] = ['gross_revenue', 'refunds', 'num_orders']
    products.forEach(p => keys.push(`units_${p.id}`))
    keys.push('platform_fee', 'commissions', 'ad_spend', 'postage_pick_pack', 'key_changes')
    return keys
  }, [products])

  // ── Cell key helper ──
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
        user_id: userId!,
        entry_id: entry.id,
        product_id: productId,
        date: entry.date,
        platform: entry.platform,
        units_sold: units,
      }, { onConflict: 'user_id,product_id,date,platform' })
    }, 600)
  }, [supabase, userId])

  // ── Add date entry (from calendar) ──
  const addDateEntry = async (dateStr: string) => {
    if (!userId) return
    setShowCalendar(false)

    const feePct = getPlatformFee(settings, platform)

    const { data, error } = await supabase.from('bible_daily_entries').upsert({
      user_id: userId,
      date: dateStr,
      platform,
      platform_fee: 0,
      ad_spend: 0,
      gmv_max_ad_spend: 0,
    }, { onConflict: 'user_id,date,platform' }).select().single()

    if (!error && data) {
      const newEntry = data as DailyEntry
      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== dateStr)
        return [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
      })
      // Scroll to the new row after render
      setTimeout(() => {
        const idx = entries.findIndex(e => e.date > dateStr)
        tableEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }

  // ── Commit current edit ──
  const commitEdit = useCallback((addr: CellAddr | null, val: string) => {
    if (!addr) return
    const entry = entries[addr.rowIdx]
    if (!entry) return

    if (addr.colKey.startsWith('units_')) {
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

      // Auto-fill platform fee when gross revenue changes
      if (addr.colKey === 'gross_revenue') {
        const feePct = getPlatformFee(settings, platform)
        const autoFee = parseFloat((numVal * feePct / 100).toFixed(2))
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, platform_fee: autoFee } : e))
        saveEntry(entry.id, 'platform_fee', autoFee)
      }
    }
  }, [entries, saveEntry, saveUnits, settings, platform])

  // ── Start editing a cell ──
  const startEdit = useCallback((rowIdx: number, colKey: string) => {
    // Commit previous edit first
    if (editingCell) {
      commitEdit(editingCell, editValue)
    }

    const entry = entries[rowIdx]
    if (!entry) return

    let val: string
    if (colKey.startsWith('units_')) {
      const productId = colKey.replace('units_', '')
      const u = allUnits.find(u => u.entry_id === entry.id && u.product_id === productId)?.units_sold || 0
      val = u === 0 ? '' : String(u)
    } else if (colKey === 'key_changes') {
      val = entry.key_changes || ''
    } else {
      const n = (entry as unknown as Record<string, unknown>)[colKey] as number || 0
      val = n === 0 ? '' : String(n)
    }

    setEditingCell({ rowIdx, colKey })
    setEditValue(val)
    setPreEditValue(val)

    // Focus input after render
    requestAnimationFrame(() => {
      const input = cellRefs.current.get(cellKey(rowIdx, colKey))
      if (input) {
        input.focus()
        input.select()
      }
    })
  }, [editingCell, editValue, entries, allUnits, commitEdit])

  // ── Navigate to adjacent cell ──
  const navigateCell = useCallback((fromRow: number, fromCol: string, direction: 'next' | 'prev' | 'down' | 'up') => {
    isNavigating.current = true
    const colIdx = editableColKeys.indexOf(fromCol)

    let targetRow = fromRow
    let targetColIdx = colIdx

    if (direction === 'next') {
      targetColIdx = colIdx + 1
      if (targetColIdx >= editableColKeys.length) {
        targetColIdx = 0
        targetRow = fromRow + 1
      }
    } else if (direction === 'prev') {
      targetColIdx = colIdx - 1
      if (targetColIdx < 0) {
        targetColIdx = editableColKeys.length - 1
        targetRow = fromRow - 1
      }
    } else if (direction === 'down') {
      targetRow = fromRow + 1
    } else if (direction === 'up') {
      targetRow = fromRow - 1
    }

    if (targetRow < 0 || targetRow >= entries.length) {
      // Out of bounds — just commit and stop
      commitEdit({ rowIdx: fromRow, colKey: fromCol }, editValue)
      setEditingCell(null)
      isNavigating.current = false
      return
    }

    const targetCol = editableColKeys[targetColIdx]
    commitEdit({ rowIdx: fromRow, colKey: fromCol }, editValue)
    startEdit(targetRow, targetCol)

    setTimeout(() => { isNavigating.current = false }, 50)
  }, [editableColKeys, entries.length, editValue, commitEdit, startEdit])

  // ── Calculated values ──
  const getUnitsForEntry = (entryId: string, productId: string) =>
    allUnits.find(u => u.entry_id === entryId && u.product_id === productId)?.units_sold || 0

  const getTotalUnits = (entryId: string) =>
    allUnits.filter(u => u.entry_id === entryId).reduce((s, u) => s + u.units_sold, 0)

  const getProductCost = (entryId: string) =>
    products.reduce((s, p) => s + getUnitsForEntry(entryId, p.id) * p.cogs, 0)

  const getAdSpend = (e: DailyEntry) => e.ad_spend + e.gmv_max_ad_spend

  const getProfit = (e: DailyEntry) => {
    const pc = getProductCost(e.id)
    return e.gross_revenue - e.refunds - e.platform_fee - e.commissions - getAdSpend(e) - pc - e.postage_pick_pack
  }

  const getAdSpendPct = (e: DailyEntry) =>
    e.gross_revenue > 0 ? (getAdSpend(e) / e.gross_revenue) * 100 : 0

  const getProfitPct = (e: DailyEntry) =>
    e.gross_revenue > 0 ? (getProfit(e) / e.gross_revenue) * 100 : 0

  // ── Used dates for calendar ──
  const usedDates = useMemo(() => new Set(entries.map(e => e.date)), [entries])

  // ── Totals ──
  const totals = useMemo(() => {
    const t = {
      gross_revenue: 0, refunds: 0, num_orders: 0, total_units: 0,
      platform_fee: 0, commissions: 0, ad_spend: 0,
      product_cost: 0, postage_pick_pack: 0, profit: 0,
    }
    entries.forEach(e => {
      t.gross_revenue += e.gross_revenue
      t.refunds += e.refunds
      t.num_orders += e.num_orders
      t.total_units += getTotalUnits(e.id)
      t.platform_fee += e.platform_fee
      t.commissions += e.commissions
      t.ad_spend += getAdSpend(e)
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
      date: e.date.slice(5),
      'Gross Revenue': e.gross_revenue,
      'Net Profit': getProfit(e),
      'Ad Spend': getAdSpend(e),
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [entries, allUnits, products])

  // ── Editable Cell ──
  const EditableCell = ({ rowIdx, colKey, value, isText = false }: {
    rowIdx: number; colKey: string; value: number | string; isText?: boolean
  }) => {
    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colKey === colKey
    const displayVal = isText
      ? (value || '—')
      : (typeof value === 'number' ? (value === 0 ? '—' : fmt(value)) : value)

    return (
      <td
        className={`
          px-3 py-2 text-sm border-r border-white/[0.04] cursor-pointer transition-colors duration-100
          ${isText ? 'text-left' : 'text-right'}
          ${isEditing ? '' : 'hover:bg-white/[0.04]'}
        `}
        onClick={() => { if (!isEditing) startEdit(rowIdx, colKey) }}
      >
        {isEditing ? (
          <input
            ref={el => { if (el) cellRefs.current.set(cellKey(rowIdx, colKey), el) }}
            type={isText ? 'text' : 'text'}
            inputMode={isText ? 'text' : 'decimal'}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => {
              if (isNavigating.current) return
              commitEdit({ rowIdx, colKey }, editValue)
              setEditingCell(null)
            }}
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault()
                navigateCell(rowIdx, colKey, e.shiftKey ? 'prev' : 'next')
              } else if (e.key === 'Enter') {
                e.preventDefault()
                navigateCell(rowIdx, colKey, 'down')
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setEditValue(preEditValue)
                setEditingCell(null)
              } else if (e.key === 'ArrowDown' && !isText) {
                e.preventDefault()
                navigateCell(rowIdx, colKey, 'down')
              } else if (e.key === 'ArrowUp' && !isText) {
                e.preventDefault()
                navigateCell(rowIdx, colKey, 'up')
              }
            }}
            className={`
              w-full bg-transparent text-white outline-none px-1 py-0.5 rounded transition-all
              ring-2 ring-[#F24822]/60 ring-offset-1 ring-offset-[#141414]
              ${isText ? 'text-left' : 'text-right'}
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            `}
          />
        ) : (
          <span className={`block tabular-nums ${isText ? '' : ''} ${typeof value === 'number' && value === 0 ? 'text-gray-600' : 'text-white'}`}>
            {displayVal}
          </span>
        )}
      </td>
    )
  }

  // ── Calculated cell (read-only) ──
  const CalcCell = ({ value, prefix = '', color }: {
    value: string | number; prefix?: string; color?: string
  }) => {
    const display = typeof value === 'number'
      ? (value === 0 ? '—' : `${prefix}${fmt(value)}`)
      : value
    return (
      <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.04] bg-white/[0.015] tabular-nums ${color || 'text-gray-400'}`}>
        {display}
      </td>
    )
  }

  // ── Units cell (integer editable) ──
  const UnitsCell = ({ rowIdx, productId, entryId }: {
    rowIdx: number; productId: string; entryId: string
  }) => {
    const colKey = `units_${productId}`
    const val = getUnitsForEntry(entryId, productId)
    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colKey === colKey

    return (
      <td
        className={`
          px-3 py-2 text-sm text-right border-r border-white/[0.04] cursor-pointer transition-colors duration-100
          ${isEditing ? '' : 'hover:bg-white/[0.04]'}
        `}
        onClick={() => { if (!isEditing) startEdit(rowIdx, colKey) }}
      >
        {isEditing ? (
          <input
            ref={el => { if (el) cellRefs.current.set(cellKey(rowIdx, colKey), el) }}
            type="text"
            inputMode="numeric"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => {
              if (isNavigating.current) return
              commitEdit({ rowIdx, colKey }, editValue)
              setEditingCell(null)
            }}
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault()
                navigateCell(rowIdx, colKey, e.shiftKey ? 'prev' : 'next')
              } else if (e.key === 'Enter') {
                e.preventDefault()
                navigateCell(rowIdx, colKey, 'down')
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setEditValue(preEditValue)
                setEditingCell(null)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                navigateCell(rowIdx, colKey, 'down')
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                navigateCell(rowIdx, colKey, 'up')
              }
            }}
            className="w-full bg-transparent text-white text-right outline-none px-1 py-0.5 rounded ring-2 ring-[#F24822]/60 ring-offset-1 ring-offset-[#141414] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <span className={`block tabular-nums ${val === 0 ? 'text-gray-600' : 'text-white'}`}>
            {dashInt(val)}
          </span>
        )}
      </td>
    )
  }

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

        {/* Date range + Settings */}
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
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition ml-1"
            title="Bible Settings"
          >
            <Settings size={14} />
          </button>
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
            <span className="ml-2 text-[10px] text-gray-500">{getPlatformFee(settings, p.key)}%</span>
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 group transition-all hover:border-white/15"
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

          {/* Data Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <th className="px-3 py-3 text-left font-medium sticky left-0 z-10 whitespace-nowrap" style={{ background: '#1a1a1a' }}>Date</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Gross Revenue</th>
                    <th className="px-3 py-3 text-right font-medium">Refunds</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap"># Orders</th>
                    {products.map(p => (
                      <th key={p.id} className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        <span className="text-gray-400">{p.name}</span>
                        <span className="block text-[9px] text-gray-600 font-normal normal-case">units</span>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Total Units</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Platform Fee</th>
                    <th className="px-3 py-3 text-right font-medium">Commissions</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Ad Spend</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Ad %</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Product Cost</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Postage+P&P</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">P/L</th>
                    <th className="px-3 py-3 text-right font-medium whitespace-nowrap">P/L %</th>
                    <th className="px-3 py-3 text-left font-medium whitespace-nowrap">Key Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={99} className="px-3 py-16 text-center text-gray-500 text-sm">
                        No entries yet. Click the <span className="text-white font-medium">+</span> button below to add your first day.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {entries.map((e, rowIdx) => {
                        const profit = getProfit(e)
                        const profitPct = getProfitPct(e)
                        const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400'
                        return (
                          <tr
                            key={e.id}
                            className="border-t border-white/[0.04] transition-colors duration-100 group/row"
                          >
                            {/* Date — sticky */}
                            <td className="px-3 py-2 text-sm font-medium sticky left-0 z-10 whitespace-nowrap" style={{ background: '#141414' }}>
                              <span className="text-white">{fmtDate(e.date)}</span>
                            </td>
                            <EditableCell rowIdx={rowIdx} colKey="gross_revenue" value={e.gross_revenue} />
                            <EditableCell rowIdx={rowIdx} colKey="refunds" value={e.refunds} />
                            <EditableCell rowIdx={rowIdx} colKey="num_orders" value={e.num_orders} />
                            {products.map(p => (
                              <UnitsCell key={p.id} rowIdx={rowIdx} productId={p.id} entryId={e.id} />
                            ))}
                            <CalcCell value={getTotalUnits(e.id)} />
                            <EditableCell rowIdx={rowIdx} colKey="platform_fee" value={e.platform_fee} />
                            <EditableCell rowIdx={rowIdx} colKey="commissions" value={e.commissions} />
                            <EditableCell rowIdx={rowIdx} colKey="ad_spend" value={getAdSpend(e)} />
                            <CalcCell value={fmtPct(getAdSpendPct(e))} />
                            <CalcCell value={getProductCost(e.id)} prefix="€" />
                            <EditableCell rowIdx={rowIdx} colKey="postage_pick_pack" value={e.postage_pick_pack} />
                            <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.04] bg-white/[0.015] font-bold tabular-nums ${profitColor}`}>
                              {profit === 0 ? '—' : `€${fmt(profit)}`}
                            </td>
                            <td className={`px-3 py-2 text-sm text-right border-r border-white/[0.04] bg-white/[0.015] font-bold tabular-nums ${profitColor}`}>
                              {profit === 0 ? '—' : fmtPct(profitPct)}
                            </td>
                            <EditableCell rowIdx={rowIdx} colKey="key_changes" value={e.key_changes || ''} isText />
                          </tr>
                        )
                      })}

                      {/* Totals row */}
                      <tr className="border-t-2 border-white/[0.1] font-semibold" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-3 text-sm sticky left-0 z-10 text-gray-300" style={{ background: '#1a1a1a' }}>TOTAL</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">€{fmt(totals.gross_revenue)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">€{fmt(totals.refunds)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">{totals.num_orders}</td>
                        {products.map(p => {
                          const total = entries.reduce((s, e) => s + getUnitsForEntry(e.id, p.id), 0)
                          return <td key={p.id} className="px-3 py-3 text-sm text-right tabular-nums text-white">{total}</td>
                        })}
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">{totals.total_units}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">€{fmt(totals.platform_fee)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">€{fmt(totals.commissions)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">€{fmt(totals.ad_spend)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">
                          {fmtPct(totals.gross_revenue > 0 ? (totals.ad_spend / totals.gross_revenue) * 100 : 0)}
                        </td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-gray-400 bg-white/[0.015]">€{fmt(totals.product_cost)}</td>
                        <td className="px-3 py-3 text-sm text-right tabular-nums text-white">€{fmt(totals.postage_pick_pack)}</td>
                        <td className={`px-3 py-3 text-sm text-right tabular-nums font-bold bg-white/[0.015] ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          €{fmt(totals.profit)}
                        </td>
                        <td className={`px-3 py-3 text-sm text-right tabular-nums font-bold bg-white/[0.015] ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmtPct(totals.gross_revenue > 0 ? (totals.profit / totals.gross_revenue) * 100 : 0)}
                        </td>
                        <td className="px-3 py-3 text-sm"></td>
                      </tr>
                    </>
                  )}

                  {/* Add row — "+" button */}
                  <tr
                    ref={tableEndRef}
                    onClick={() => setShowCalendar(true)}
                    className="border-t border-dashed border-white/[0.08] cursor-pointer group/add transition-colors duration-150 hover:bg-white/[0.03]"
                  >
                    <td
                      colSpan={15 + products.length}
                      className="px-3 py-4 text-center"
                    >
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

      {/* Calendar Picker */}
      {showCalendar && (
        <CalendarPicker
          usedDates={usedDates}
          onSelect={addDateEntry}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
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
      <div className="rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Product Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vitamin C Serum"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">SKU (optional)</label>
            <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. VCS-001"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">COGS per unit (€) *</label>
            <input type="number" step="0.01" value={cogs} onChange={e => setCogs(e.target.value)} placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
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

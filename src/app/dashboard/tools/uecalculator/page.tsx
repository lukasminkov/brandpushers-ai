'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calculator, TrendingUp, DollarSign, Percent, ChevronDown } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
type Platform = 'tiktok_shop' | 'amazon' | 'shopify'
type Mode = 'calculate' | 'target'

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'tiktok_shop', label: 'TikTok Shop' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'shopify', label: 'Shopify' },
]

const AMAZON_CATEGORIES: { label: string; fee: number }[] = [
  { label: 'Custom', fee: 15 },
  { label: 'Electronics', fee: 8 },
  { label: 'Computers', fee: 8 },
  { label: 'Camera & Photo', fee: 8 },
  { label: 'Video Games', fee: 15 },
  { label: 'Books', fee: 15 },
  { label: 'Clothing & Accessories', fee: 17 },
  { label: 'Shoes, Handbags & Sunglasses', fee: 15 },
  { label: 'Jewelry', fee: 20 },
  { label: 'Watches', fee: 16 },
  { label: 'Home & Kitchen', fee: 15 },
  { label: 'Grocery & Gourmet', fee: 8 },
  { label: 'Health & Personal Care', fee: 8 },
  { label: 'Beauty', fee: 8 },
  { label: 'Baby Products', fee: 8 },
  { label: 'Pet Supplies', fee: 15 },
  { label: 'Sports & Outdoors', fee: 15 },
  { label: 'Tools & Home Improvement', fee: 15 },
  { label: 'Toys & Games', fee: 15 },
  { label: 'Automotive', fee: 12 },
  { label: 'Industrial & Scientific', fee: 12 },
  { label: 'Office Products', fee: 15 },
]

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'

// ── NumberInput ────────────────────────────────────────────────────
function NumberInput({ label, value, onChange, suffix, prefix, step = 0.01, min = 0, disabled = false, hint }: {
  label: string; value: number; onChange: (v: number) => void
  suffix?: string; prefix?: string; step?: number; min?: number; disabled?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{prefix}</span>}
        <input
          type="number"
          step={step}
          min={min}
          value={value || ''}
          disabled={disabled}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 
            focus:outline-none focus:border-[#F24822]/50 transition tabular-nums
            ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

// ── Slider Input ───────────────────────────────────────────────────
function SliderInput({ label, value, onChange, min = 0, max = 100, step = 0.5, suffix = '%', disabled = false }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; suffix?: string; disabled?: boolean
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-gray-400 font-medium">{label}</label>
        <span className="text-xs text-white font-semibold tabular-nums">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, #F24822 0%, #F24822 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />
    </div>
  )
}

// ── MetricCard ─────────────────────────────────────────────────────
function MetricCard({ label, value, subtext, accent = false, large = false }: {
  label: string; value: string; subtext?: string; accent?: boolean; large?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 ${large ? 'col-span-full sm:col-span-1' : ''}`}
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(155,14,229,0.15), rgba(242,72,34,0.15))'
          : 'rgba(255,255,255,0.03)',
        border: accent
          ? '1px solid rgba(242,72,34,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className={`font-bold tabular-nums ${large ? 'text-2xl' : 'text-lg'} ${
        accent ? 'bg-gradient-to-r from-[#9B0EE5] to-[#F57B18] bg-clip-text text-transparent' : 'text-white'
      }`}>
        {value}
      </p>
      {subtext && <p className="text-[11px] text-gray-500 mt-1">{subtext}</p>}
    </div>
  )
}

// ── BreakdownRow ───────────────────────────────────────────────────
function BreakdownRow({ label, value, negative, bold, highlight }: {
  label: string; value: number; negative?: boolean; bold?: boolean; highlight?: 'green' | 'red'
}) {
  const color = highlight
    ? highlight === 'green' ? 'text-green-400' : 'text-red-400'
    : negative ? 'text-red-400/70' : 'text-white'
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm tabular-nums ${color}`}>
        {value < 0 ? '-' : ''}${fmt(Math.abs(value))}
      </span>
    </div>
  )
}

// ── WaterfallBar ───────────────────────────────────────────────────
function WaterfallBar({ salesPrice, segments }: {
  salesPrice: number
  segments: { label: string; value: number; color: string }[]
}) {
  if (salesPrice <= 0) return null
  const totalDeductions = segments.reduce((s, seg) => s + seg.value, 0)
  const profit = salesPrice - totalDeductions
  const allSegs = [...segments, ...(profit > 0 ? [{ label: 'Profit', value: profit, color: '#22c55e' }] : [])]

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden h-8 mb-3">
        {allSegs.map((seg, i) => {
          const pct = (seg.value / salesPrice) * 100
          if (pct < 0.5) return null
          return (
            <div
              key={i}
              className="flex items-center justify-center text-[9px] font-bold text-white/90 transition-all duration-500"
              style={{ width: `${pct}%`, background: seg.color, minWidth: pct > 3 ? 'auto' : 0 }}
              title={`${seg.label}: $${fmt(seg.value)} (${pct.toFixed(1)}%)`}
            >
              {pct > 6 ? seg.label : ''}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {allSegs.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-[10px] text-gray-500">{seg.label}</span>
            <span className="text-[10px] text-gray-400 tabular-nums">{((seg.value / salesPrice) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function CalculatorPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('tiktok_shop')
  const [mode, setMode] = useState<Mode>('calculate')

  // ── Shared inputs ────────────────────────────────────────────
  const [salesPrice, setSalesPrice] = useState(29.99)
  const [productCost, setProductCost] = useState(5)
  const [refundPct, setRefundPct] = useState(5)

  // ── TikTok inputs ────────────────────────────────────────────
  const [ttPlatformFee, setTtPlatformFee] = useState(9)
  const [ttPostage, setTtPostage] = useState(3.5)
  const [ttPickPack, setTtPickPack] = useState(1.5)
  const [ttOpenCollab, setTtOpenCollab] = useState(15)
  const [ttTargetCollab, setTtTargetCollab] = useState(20)
  const [ttAdsCommission, setTtAdsCommission] = useState(10)
  const [ttMixAds, setTtMixAds] = useState(60)
  const [ttMixOpen, setTtMixOpen] = useState(25)
  const [ttMixTarget, setTtMixTarget] = useState(15)
  const [ttTargetRoas, setTtTargetRoas] = useState(3)

  // ── Amazon inputs ────────────────────────────────────────────
  const [amzCategory, setAmzCategory] = useState(0) // index into AMAZON_CATEGORIES
  const [amzReferralFee, setAmzReferralFee] = useState(15)
  const [amzFbaFee, setAmzFbaFee] = useState(5.40)
  const [amzStorageFee, setAmzStorageFee] = useState(0.15)
  const [amzAcos, setAmzAcos] = useState(30)
  const [amzTargetAcos, setAmzTargetAcos] = useState(25)

  // ── Shopify inputs ───────────────────────────────────────────
  const [shopPaymentPct, setShopPaymentPct] = useState(2.9)
  const [shopPaymentFlat, setShopPaymentFlat] = useState(0.30)
  const [shopShipping, setShopShipping] = useState(5)
  const [shopPickPack, setShopPickPack] = useState(1.5)
  const [shopTargetRoas, setShopTargetRoas] = useState(3)

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

  // Sync Amazon referral fee with category preset
  useEffect(() => {
    setAmzReferralFee(AMAZON_CATEGORIES[amzCategory].fee)
  }, [amzCategory])

  // ── TikTok calculations ──────────────────────────────────────
  const ttCalc = useMemo(() => {
    const totalMix = ttMixAds + ttMixOpen + ttMixTarget
    const wAds = totalMix > 0 ? ttMixAds / totalMix : 1/3
    const wOpen = totalMix > 0 ? ttMixOpen / totalMix : 1/3
    const wTarget = totalMix > 0 ? ttMixTarget / totalMix : 1/3
    const blended = wOpen * ttOpenCollab + wTarget * ttTargetCollab + wAds * ttAdsCommission
    const refundAmt = salesPrice * (refundPct / 100)
    const platformFeeAmt = salesPrice * (ttPlatformFee / 100)
    const affiliateAmt = salesPrice * (blended / 100)
    const netRevenue = salesPrice - refundAmt - platformFeeAmt - affiliateAmt
    const totalCosts = productCost + ttPostage + ttPickPack
    const profit = netRevenue - totalCosts
    const margin = salesPrice > 0 ? (profit / salesPrice) * 100 : 0
    const breakevenRoas = profit > 0 ? salesPrice / profit : Infinity
    const adSpendAtTarget = ttTargetRoas > 0 ? salesPrice / ttTargetRoas : 0
    const profitAtTarget = profit - adSpendAtTarget
    const marginAtTarget = salesPrice > 0 ? (profitAtTarget / salesPrice) * 100 : 0
    return { blended, refundAmt, platformFeeAmt, affiliateAmt, netRevenue, totalCosts, profit, margin, breakevenRoas, adSpendAtTarget, profitAtTarget, marginAtTarget }
  }, [salesPrice, refundPct, ttPlatformFee, ttPostage, ttPickPack, ttOpenCollab, ttTargetCollab, ttAdsCommission, ttMixAds, ttMixOpen, ttMixTarget, productCost, ttTargetRoas])

  // ── Amazon calculations ──────────────────────────────────────
  const amzCalc = useMemo(() => {
    const refundAmt = salesPrice * (refundPct / 100)
    const referralAmt = salesPrice * (amzReferralFee / 100)
    const netRevenue = salesPrice - refundAmt - referralAmt
    const totalCosts = productCost + amzFbaFee + amzStorageFee
    const profitBeforeAds = netRevenue - totalCosts
    const margin = salesPrice > 0 ? (profitBeforeAds / salesPrice) * 100 : 0
    // ACoS = ad spend / sales * 100 → ad spend = sales * ACoS / 100
    // Breakeven ACoS: profit_before_ads = ad_spend → ad_spend = profitBeforeAds
    // ACoS = ad_spend / salesPrice * 100 = profitBeforeAds / salesPrice * 100
    const breakevenAcos = salesPrice > 0 && profitBeforeAds > 0 ? (profitBeforeAds / salesPrice) * 100 : 0
    const adSpendAtTarget = salesPrice * (amzTargetAcos / 100)
    const profitAtTarget = profitBeforeAds - adSpendAtTarget
    const marginAtTarget = salesPrice > 0 ? (profitAtTarget / salesPrice) * 100 : 0
    return { refundAmt, referralAmt, netRevenue, totalCosts, profitBeforeAds, margin, breakevenAcos, adSpendAtTarget, profitAtTarget, marginAtTarget }
  }, [salesPrice, refundPct, amzReferralFee, amzFbaFee, amzStorageFee, productCost, amzTargetAcos])

  // ── Shopify calculations ─────────────────────────────────────
  const shopCalc = useMemo(() => {
    const refundAmt = salesPrice * (refundPct / 100)
    const paymentFeeAmt = salesPrice * (shopPaymentPct / 100) + shopPaymentFlat
    const netRevenue = salesPrice - refundAmt - paymentFeeAmt
    const totalCosts = productCost + shopShipping + shopPickPack
    const profitBeforeAds = netRevenue - totalCosts
    const margin = salesPrice > 0 ? (profitBeforeAds / salesPrice) * 100 : 0
    const breakevenRoas = profitBeforeAds > 0 ? salesPrice / profitBeforeAds : Infinity
    const adSpendAtTarget = shopTargetRoas > 0 ? salesPrice / shopTargetRoas : 0
    const profitAtTarget = profitBeforeAds - adSpendAtTarget
    const marginAtTarget = salesPrice > 0 ? (profitAtTarget / salesPrice) * 100 : 0
    return { refundAmt, paymentFeeAmt, netRevenue, totalCosts, profitBeforeAds, margin, breakevenRoas, adSpendAtTarget, profitAtTarget, marginAtTarget }
  }, [salesPrice, refundPct, shopPaymentPct, shopPaymentFlat, shopShipping, shopPickPack, productCost, shopTargetRoas])

  if (!userId) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  }

  // ── Determine labels and values based on platform ────────────
  const roasLabel = platform === 'tiktok_shop' ? 'ROI' : platform === 'amazon' ? 'ACoS' : 'ROAS'
  const modeLabels = {
    tiktok_shop: { calc: 'Calculate Breakeven', target: 'Target ROI' },
    amazon: { calc: 'Calculate Breakeven', target: 'Target ACoS' },
    shopify: { calc: 'Calculate Breakeven', target: 'Target ROAS' },
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}>
            <Calculator size={20} className="text-white" />
          </span>
          Unit Economics Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-1">Calculate per-unit profitability tailored to each platform</p>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.07] pb-px">
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            onClick={() => { setPlatform(p.key); setMode('calculate') }}
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

      {/* Mode toggle */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setMode('calculate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'calculate'
              ? 'bg-[#F24822]/15 text-[#F24822] border border-[#F24822]/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
          }`}
        >
          <Calculator size={14} /> {modeLabels[platform].calc}
        </button>
        <button
          onClick={() => setMode('target')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'target'
              ? 'bg-[#F24822]/15 text-[#F24822] border border-[#F24822]/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
          }`}
        >
          <TrendingUp size={14} /> {modeLabels[platform].target}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Inputs (3 cols) ──────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Shared: Product Economics */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400" /> Product Economics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput label="Product Sales Price" value={salesPrice} onChange={setSalesPrice} prefix="$" />
              <NumberInput label="Product Cost (COGS)" value={productCost} onChange={setProductCost} prefix="$" />
              {platform === 'tiktok_shop' && (
                <>
                  <NumberInput label="Postage" value={ttPostage} onChange={setTtPostage} prefix="$" step={0.1} hint="Flat rate per unit" />
                  <NumberInput label="Pick & Pack" value={ttPickPack} onChange={setTtPickPack} prefix="$" step={0.1} hint="Flat rate per unit" />
                </>
              )}
              {platform === 'shopify' && (
                <>
                  <NumberInput label="Shipping Cost" value={shopShipping} onChange={setShopShipping} prefix="$" step={0.1} hint="Per order" />
                  <NumberInput label="Pick & Pack" value={shopPickPack} onChange={setShopPickPack} prefix="$" step={0.1} hint="Per order" />
                </>
              )}
            </div>
          </div>

          {/* Platform-specific Fees */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Percent size={14} className="text-gray-400" />
              {platform === 'tiktok_shop' ? 'Platform Fees & Deductions' :
               platform === 'amazon' ? 'Amazon Fees' : 'Shopify Fees'}
            </h2>

            {/* ─ TikTok fees ─ */}
            {platform === 'tiktok_shop' && (
              <div className="space-y-4">
                <SliderInput label="Platform Fee" value={ttPlatformFee} onChange={setTtPlatformFee} max={30} step={0.1} />
                <SliderInput label="Refund Rate" value={refundPct} onChange={setRefundPct} max={30} step={0.5} />
              </div>
            )}

            {/* ─ Amazon fees ─ */}
            {platform === 'amazon' && (
              <div className="space-y-4">
                {/* Category dropdown */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Product Category</label>
                  <div className="relative">
                    <select
                      value={amzCategory}
                      onChange={e => setAmzCategory(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-[#F24822]/50 transition"
                    >
                      {AMAZON_CATEGORIES.map((cat, i) => (
                        <option key={i} value={i} className="bg-[#1a1a1a]">{cat.label} ({cat.fee}%)</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <SliderInput label="Referral Fee" value={amzReferralFee} onChange={v => { setAmzReferralFee(v); setAmzCategory(0) }} max={25} step={0.5} />
                <NumberInput label="FBA Fulfillment Fee" value={amzFbaFee} onChange={setAmzFbaFee} prefix="$" step={0.1} hint="Per unit — varies by size/weight tier" />
                <NumberInput label="Storage Fee" value={amzStorageFee} onChange={setAmzStorageFee} prefix="$" step={0.01} hint="Per unit per month (standard ~$0.87/cu ft)" />
                <SliderInput label="Refund Rate" value={refundPct} onChange={setRefundPct} max={30} step={0.5} />
              </div>
            )}

            {/* ─ Shopify fees ─ */}
            {platform === 'shopify' && (
              <div className="space-y-4">
                <SliderInput label="Payment Processing Fee" value={shopPaymentPct} onChange={setShopPaymentPct} max={10} step={0.1} />
                <NumberInput label="Per-Transaction Flat Fee" value={shopPaymentFlat} onChange={setShopPaymentFlat} prefix="$" step={0.05} hint="Shopify Payments: $0.30 per transaction" />
                <SliderInput label="Refund Rate" value={refundPct} onChange={setRefundPct} max={30} step={0.5} />
              </div>
            )}
          </div>

          {/* ─ TikTok: Affiliate Commissions ─ */}
          {platform === 'tiktok_shop' && (
            <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-gray-400" /> Affiliate Commissions
              </h2>
              <div className="space-y-4">
                <SliderInput label="Open Collab %" value={ttOpenCollab} onChange={setTtOpenCollab} max={50} step={0.5} />
                <SliderInput label="Target Collab %" value={ttTargetCollab} onChange={setTtTargetCollab} max={50} step={0.5} />
                <SliderInput label="Ads Commission %" value={ttAdsCommission} onChange={setTtAdsCommission} max={50} step={0.5} />
              </div>

              {/* Channel Sales Mix */}
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white">Channel Sales Mix</span>
                  <span className="text-[10px] text-gray-500">What % of sales come from each channel?</span>
                </div>
                <div className="space-y-3">
                  <SliderInput label={`GMV Max / Shop Ads — ${ttMixAds}%`} value={ttMixAds} onChange={v => { setTtMixAds(v); setTtMixOpen(Math.max(0, 100 - v - ttMixTarget)) }} min={0} max={100} step={1} suffix="%" />
                  <SliderInput label={`Open Collab — ${ttMixOpen}%`} value={ttMixOpen} onChange={v => { setTtMixOpen(v); setTtMixAds(Math.max(0, 100 - v - ttMixTarget)) }} min={0} max={100} step={1} suffix="%" />
                  <SliderInput label={`Target Collab — ${ttMixTarget}%`} value={ttMixTarget} onChange={v => { setTtMixTarget(v); setTtMixAds(Math.max(0, 100 - v - ttMixOpen)) }} min={0} max={100} step={1} suffix="%" />
                </div>
                {/* Visual bar */}
                <div className="flex rounded-lg overflow-hidden h-2 mt-3">
                  {ttMixAds > 0 && <div className="bg-[#F24822] transition-all" style={{ width: `${(ttMixAds / (ttMixAds + ttMixOpen + ttMixTarget || 1)) * 100}%` }} />}
                  {ttMixOpen > 0 && <div className="bg-[#a855f7] transition-all" style={{ width: `${(ttMixOpen / (ttMixAds + ttMixOpen + ttMixTarget || 1)) * 100}%` }} />}
                  {ttMixTarget > 0 && <div className="bg-[#06b6d4] transition-all" style={{ width: `${(ttMixTarget / (ttMixAds + ttMixOpen + ttMixTarget || 1)) * 100}%` }} />}
                </div>
                <div className="flex gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#F24822]" />Ads</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#a855f7]" />Open</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#06b6d4]" />Target</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(155,14,229,0.1)', border: '1px solid rgba(155,14,229,0.2)' }}>
                <div>
                  <span className="text-xs text-gray-300 font-medium">Blended Affiliate Rate</span>
                  <span className="text-[10px] text-gray-500 ml-2">(weighted by sales mix)</span>
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-[#9B0EE5] to-[#F57B18] bg-clip-text text-transparent">
                  {ttCalc.blended.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* ─ Amazon: Advertising (ACoS) ─ */}
          {platform === 'amazon' && mode === 'target' && (
            <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(242,72,34,0.15)' }}>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#F24822]" /> Amazon PPC — Target ACoS
              </h2>
              <div className="space-y-4">
                <SliderInput label="Target ACoS" value={amzTargetAcos} onChange={setAmzTargetAcos} min={1} max={100} step={0.5} />
                <p className="text-[11px] text-gray-500">
                  At {amzTargetAcos}% ACoS, you'd spend <span className="text-white font-medium">${fmt(amzCalc.adSpendAtTarget)}</span> on ads per ${fmt(salesPrice)} sale
                </p>
              </div>
            </div>
          )}

          {/* ─ Shopify: Target ROAS ─ */}
          {platform === 'shopify' && mode === 'target' && (
            <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(242,72,34,0.15)' }}>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#F24822]" /> Ad Spend — Target ROAS
              </h2>
              <div className="space-y-4">
                <SliderInput label="Target ROAS" value={shopTargetRoas} onChange={setShopTargetRoas} min={0.5} max={20} step={0.1} suffix="x" />
                <p className="text-[11px] text-gray-500">
                  At {shopTargetRoas}x ROAS, you'd spend <span className="text-white font-medium">${fmt(shopCalc.adSpendAtTarget)}</span> on ads per ${fmt(salesPrice)} sale
                </p>
              </div>
            </div>
          )}

          {/* ─ TikTok: Target ROI ─ */}
          {platform === 'tiktok_shop' && mode === 'target' && (
            <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(242,72,34,0.15)' }}>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#F24822]" /> Target ROI
              </h2>
              <div className="space-y-4">
                <SliderInput label="Desired ROI" value={ttTargetRoas} onChange={setTtTargetRoas} min={0.5} max={20} step={0.1} suffix="x" />
                <p className="text-[11px] text-gray-500">
                  At {ttTargetRoas}x ROI, you'd spend <span className="text-white font-medium">${fmt(ttCalc.adSpendAtTarget)}</span> on ads per ${fmt(salesPrice)} sale
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Results (2 cols) ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* ═══ TIKTOK RESULTS ═══ */}
          {platform === 'tiktok_shop' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Profit / Unit"
                  value={`$${fmt(mode === 'target' ? ttCalc.profitAtTarget : ttCalc.profit)}`}
                  subtext={`${fmtPct(mode === 'target' ? ttCalc.marginAtTarget : ttCalc.margin)} margin`}
                  accent large
                />
                <MetricCard
                  label="Breakeven ROI"
                  value={ttCalc.breakevenRoas === Infinity ? '∞' : `${ttCalc.breakevenRoas.toFixed(2)}x`}
                  subtext={ttCalc.breakevenRoas === Infinity ? 'Unprofitable before ads' : 'Min ROI to break even'}
                  accent large
                />
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <BreakdownRow label="Sales Price" value={salesPrice} />
                  <BreakdownRow label={`Refunds (${refundPct}%)`} value={-ttCalc.refundAmt} negative />
                  <BreakdownRow label={`Platform Fee (${ttPlatformFee}%)`} value={-ttCalc.platformFeeAmt} negative />
                  <BreakdownRow label={`Affiliate (${ttCalc.blended.toFixed(1)}%)`} value={-ttCalc.affiliateAmt} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow label="Net Revenue" value={ttCalc.netRevenue} bold />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Costs Breakdown</h3>
                <div className="space-y-3">
                  <BreakdownRow label="Product Cost (COGS)" value={-productCost} negative />
                  <BreakdownRow label="Postage" value={-ttPostage} negative />
                  <BreakdownRow label="Pick & Pack" value={-ttPickPack} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow label="Total Costs" value={-ttCalc.totalCosts} negative bold />
                  </div>
                </div>
              </div>
              <ProfitSummary
                mode={mode}
                label={mode === 'target' ? `Profit at ${ttTargetRoas}x ROI` : 'Profit (Before Ads)'}
                profitBeforeAds={ttCalc.profit}
                adSpend={ttCalc.adSpendAtTarget}
                profitAtTarget={ttCalc.profitAtTarget}
                netRevenue={ttCalc.netRevenue}
                totalCosts={ttCalc.totalCosts}
                targetLabel={`${ttTargetRoas}x ROI`}
              />
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Unit Economics Waterfall</h3>
                <WaterfallBar salesPrice={salesPrice} segments={[
                  { label: 'Refund', value: ttCalc.refundAmt, color: '#ef4444' },
                  { label: 'Platform', value: ttCalc.platformFeeAmt, color: '#f97316' },
                  { label: 'Affiliate', value: ttCalc.affiliateAmt, color: '#a855f7' },
                  { label: 'COGS', value: productCost, color: '#eab308' },
                  { label: 'Postage', value: ttPostage, color: '#6366f1' },
                  { label: 'P&P', value: ttPickPack, color: '#06b6d4' },
                  ...(mode === 'target' ? [{ label: 'Ads', value: ttCalc.adSpendAtTarget, color: '#f43f5e' }] : []),
                ]} />
              </div>
            </>
          )}

          {/* ═══ AMAZON RESULTS ═══ */}
          {platform === 'amazon' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Profit / Unit"
                  value={`$${fmt(mode === 'target' ? amzCalc.profitAtTarget : amzCalc.profitBeforeAds)}`}
                  subtext={`${fmtPct(mode === 'target' ? amzCalc.marginAtTarget : amzCalc.margin)} margin`}
                  accent large
                />
                <MetricCard
                  label="Breakeven ACoS"
                  value={amzCalc.breakevenAcos <= 0 ? '0%' : `${amzCalc.breakevenAcos.toFixed(1)}%`}
                  subtext={amzCalc.breakevenAcos <= 0 ? 'Unprofitable before ads' : 'Max ACoS to break even'}
                  accent large
                />
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <BreakdownRow label="Sales Price" value={salesPrice} />
                  <BreakdownRow label={`Refunds (${refundPct}%)`} value={-amzCalc.refundAmt} negative />
                  <BreakdownRow label={`Referral Fee (${amzReferralFee}%)`} value={-amzCalc.referralAmt} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow label="Net Revenue" value={amzCalc.netRevenue} bold />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Costs Breakdown</h3>
                <div className="space-y-3">
                  <BreakdownRow label="Product Cost (COGS)" value={-productCost} negative />
                  <BreakdownRow label="FBA Fulfillment" value={-amzFbaFee} negative />
                  <BreakdownRow label="Storage" value={-amzStorageFee} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow label="Total Costs" value={-amzCalc.totalCosts} negative bold />
                  </div>
                </div>
              </div>
              <ProfitSummary
                mode={mode}
                label={mode === 'target' ? `Profit at ${amzTargetAcos}% ACoS` : 'Profit (Before Ads)'}
                profitBeforeAds={amzCalc.profitBeforeAds}
                adSpend={amzCalc.adSpendAtTarget}
                profitAtTarget={amzCalc.profitAtTarget}
                netRevenue={amzCalc.netRevenue}
                totalCosts={amzCalc.totalCosts}
                targetLabel={`${amzTargetAcos}% ACoS`}
              />
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Unit Economics Waterfall</h3>
                <WaterfallBar salesPrice={salesPrice} segments={[
                  { label: 'Refund', value: amzCalc.refundAmt, color: '#ef4444' },
                  { label: 'Referral', value: amzCalc.referralAmt, color: '#f97316' },
                  { label: 'COGS', value: productCost, color: '#eab308' },
                  { label: 'FBA', value: amzFbaFee, color: '#a855f7' },
                  { label: 'Storage', value: amzStorageFee, color: '#06b6d4' },
                  ...(mode === 'target' ? [{ label: 'PPC', value: amzCalc.adSpendAtTarget, color: '#f43f5e' }] : []),
                ]} />
              </div>
            </>
          )}

          {/* ═══ SHOPIFY RESULTS ═══ */}
          {platform === 'shopify' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Profit / Unit"
                  value={`$${fmt(mode === 'target' ? shopCalc.profitAtTarget : shopCalc.profitBeforeAds)}`}
                  subtext={`${fmtPct(mode === 'target' ? shopCalc.marginAtTarget : shopCalc.margin)} margin`}
                  accent large
                />
                <MetricCard
                  label="Breakeven ROAS"
                  value={shopCalc.breakevenRoas === Infinity ? '∞' : `${shopCalc.breakevenRoas.toFixed(2)}x`}
                  subtext={shopCalc.breakevenRoas === Infinity ? 'Unprofitable before ads' : 'Min ROAS to break even'}
                  accent large
                />
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <BreakdownRow label="Sales Price" value={salesPrice} />
                  <BreakdownRow label={`Refunds (${refundPct}%)`} value={-shopCalc.refundAmt} negative />
                  <BreakdownRow label={`Payment Processing (${shopPaymentPct}% + $${shopPaymentFlat.toFixed(2)})`} value={-shopCalc.paymentFeeAmt} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow label="Net Revenue" value={shopCalc.netRevenue} bold />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Costs Breakdown</h3>
                <div className="space-y-3">
                  <BreakdownRow label="Product Cost (COGS)" value={-productCost} negative />
                  <BreakdownRow label="Shipping" value={-shopShipping} negative />
                  <BreakdownRow label="Pick & Pack" value={-shopPickPack} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow label="Total Costs" value={-shopCalc.totalCosts} negative bold />
                  </div>
                </div>
              </div>
              <ProfitSummary
                mode={mode}
                label={mode === 'target' ? `Profit at ${shopTargetRoas}x ROAS` : 'Profit (Before Ads)'}
                profitBeforeAds={shopCalc.profitBeforeAds}
                adSpend={shopCalc.adSpendAtTarget}
                profitAtTarget={shopCalc.profitAtTarget}
                netRevenue={shopCalc.netRevenue}
                totalCosts={shopCalc.totalCosts}
                targetLabel={`${shopTargetRoas}x ROAS`}
              />
              <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Unit Economics Waterfall</h3>
                <WaterfallBar salesPrice={salesPrice} segments={[
                  { label: 'Refund', value: shopCalc.refundAmt, color: '#ef4444' },
                  { label: 'Processing', value: shopCalc.paymentFeeAmt, color: '#f97316' },
                  { label: 'COGS', value: productCost, color: '#eab308' },
                  { label: 'Shipping', value: shopShipping, color: '#6366f1' },
                  { label: 'P&P', value: shopPickPack, color: '#06b6d4' },
                  ...(mode === 'target' ? [{ label: 'Ads', value: shopCalc.adSpendAtTarget, color: '#f43f5e' }] : []),
                ]} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ProfitSummary ──────────────────────────────────────────────────
function ProfitSummary({ mode, label, profitBeforeAds, adSpend, profitAtTarget, netRevenue, totalCosts, targetLabel }: {
  mode: Mode; label: string; profitBeforeAds: number; adSpend: number; profitAtTarget: number
  netRevenue: number; totalCosts: number; targetLabel: string
}) {
  const displayProfit = mode === 'target' ? profitAtTarget : profitBeforeAds
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: displayProfit >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
        border: displayProfit >= 0 ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(239,68,68,0.15)',
      }}
    >
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</h3>
      <div className="space-y-3">
        {mode === 'calculate' ? (
          <>
            <BreakdownRow label="Net Revenue" value={netRevenue} />
            <BreakdownRow label="Total Costs" value={-totalCosts} negative />
            <div className="border-t border-white/[0.08] pt-3">
              <BreakdownRow label="Profit per Unit" value={profitBeforeAds} bold highlight={profitBeforeAds >= 0 ? 'green' : 'red'} />
            </div>
          </>
        ) : (
          <>
            <BreakdownRow label="Profit (before ads)" value={profitBeforeAds} />
            <BreakdownRow label={`Ad Spend (${targetLabel})`} value={-adSpend} negative />
            <div className="border-t border-white/[0.08] pt-3">
              <BreakdownRow label="Net Profit per Unit" value={profitAtTarget} bold highlight={profitAtTarget >= 0 ? 'green' : 'red'} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

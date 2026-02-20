'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calculator, Info, ToggleLeft, ToggleRight, TrendingUp, DollarSign, Percent, ArrowRight } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
type Platform = 'tiktok_shop' | 'amazon' | 'shopify'
type Mode = 'calculate' | 'target'

const PLATFORMS: { key: Platform; label: string; fee: number; roasLabel: string }[] = [
  { key: 'tiktok_shop', label: 'TikTok Shop', fee: 9, roasLabel: 'ROI' },
  { key: 'amazon', label: 'Amazon', fee: 15, roasLabel: 'ROAS' },
  { key: 'shopify', label: 'Shopify', fee: 2.9, roasLabel: 'ROAS' },
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
      <div className="relative">
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

// ── Main Page ──────────────────────────────────────────────────────
export default function CalculatorPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)

  // Platform
  const [platform, setPlatform] = useState<Platform>('tiktok_shop')
  const platformConfig = PLATFORMS.find(p => p.key === platform)!

  // Mode
  const [mode, setMode] = useState<Mode>('calculate')

  // Inputs
  const [salesPrice, setSalesPrice] = useState(29.99)
  const [refundPct, setRefundPct] = useState(5)
  const [useAvgRefund, setUseAvgRefund] = useState(true)
  const [platformFeePct, setPlatformFeePct] = useState(platformConfig.fee)
  const [postage, setPostage] = useState(3.5)
  const [productCost, setProductCost] = useState(5)
  const [pickPack, setPickPack] = useState(1.5)

  // Affiliate commissions
  const [openCollab, setOpenCollab] = useState(15)
  const [targetCollab, setTargetCollab] = useState(20)
  const [adsCommission, setAdsCommission] = useState(10)

  // Target mode
  const [targetRoas, setTargetRoas] = useState(3)

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

  // Update platform fee when switching platforms
  useEffect(() => {
    setPlatformFeePct(platformConfig.fee)
  }, [platform, platformConfig.fee])

  // Update refund when toggling average
  useEffect(() => {
    if (useAvgRefund) setRefundPct(5)
  }, [useAvgRefund])

  // ── Calculations ─────────────────────────────────────────────────
  const calc = useMemo(() => {
    // Blended affiliate commission (simple average of 3 rates)
    const blendedAffiliate = (openCollab + targetCollab + adsCommission) / 3

    // Revenue calculations
    const grossRevenue = salesPrice
    const refundAmount = grossRevenue * (refundPct / 100)
    const netAfterRefunds = grossRevenue - refundAmount
    const platformFeeAmount = grossRevenue * (platformFeePct / 100)
    const affiliateAmount = grossRevenue * (blendedAffiliate / 100)
    const netRevenue = netAfterRefunds - platformFeeAmount - affiliateAmount

    // Total variable costs per unit
    const totalCosts = productCost + postage + pickPack
    const totalDeductions = refundAmount + platformFeeAmount + affiliateAmount

    // Profit per unit
    const profitPerUnit = netRevenue - totalCosts
    const profitMargin = grossRevenue > 0 ? (profitPerUnit / grossRevenue) * 100 : 0

    // Breakeven ROAS
    // ROAS = Revenue / Ad Spend. At breakeven, profit = 0
    // revenue - all_costs - ad_spend = 0 → ad_spend = revenue - all_costs = profitPerUnit
    // If profitPerUnit <= 0, no breakeven possible (already losing money before ads)
    // Breakeven ROAS = revenue / ad_spend_at_breakeven
    // But actually: ROAS = revenue / ad_spend, breakeven means profit after ad spend = 0
    // profit_before_ads = netRevenue - totalCosts = profitPerUnit
    // At breakeven: profit_before_ads = ad_spend, so ad_spend = profitPerUnit
    // ROAS = grossRevenue / ad_spend = grossRevenue / profitPerUnit
    const breakevenRoas = profitPerUnit > 0 ? grossRevenue / profitPerUnit : Infinity

    // Target ROAS mode: given a target ROAS, calculate projected profit
    // ROAS = revenue / ad_spend → ad_spend = revenue / target_roas
    const adSpendAtTarget = targetRoas > 0 ? grossRevenue / targetRoas : 0
    const profitAtTarget = profitPerUnit - adSpendAtTarget
    const marginAtTarget = grossRevenue > 0 ? (profitAtTarget / grossRevenue) * 100 : 0

    return {
      blendedAffiliate,
      grossRevenue,
      refundAmount,
      netAfterRefunds,
      platformFeeAmount,
      affiliateAmount,
      netRevenue,
      totalCosts,
      totalDeductions,
      profitPerUnit,
      profitMargin,
      breakevenRoas,
      adSpendAtTarget,
      profitAtTarget,
      marginAtTarget,
    }
  }, [salesPrice, refundPct, platformFeePct, postage, productCost, pickPack, openCollab, targetCollab, adsCommission, targetRoas])

  const roasLabel = platformConfig.roasLabel

  if (!userId) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}>
            <Calculator size={20} className="text-white" />
          </span>
          Profit Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-1">Calculate your per-unit profitability and breakeven {roasLabel}</p>
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
          <Calculator size={14} /> Calculate Breakeven
        </button>
        <button
          onClick={() => setMode('target')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'target'
              ? 'bg-[#F24822]/15 text-[#F24822] border border-[#F24822]/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
          }`}
        >
          <TrendingUp size={14} /> Target {roasLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Inputs (3 cols) ──────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Product Economics */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400" /> Product Economics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput label="Product Sales Price" value={salesPrice} onChange={setSalesPrice} prefix="$" step={0.01} />
              <NumberInput label="Product Cost (COGS)" value={productCost} onChange={setProductCost} prefix="$" step={0.01} />
              <NumberInput label="Postage" value={postage} onChange={setPostage} prefix="$" step={0.1} hint="Flat rate per unit" />
              <NumberInput label="Pick & Pack" value={pickPack} onChange={setPickPack} prefix="$" step={0.1} hint="Flat rate per unit" />
            </div>
          </div>

          {/* Platform Fees */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Percent size={14} className="text-gray-400" /> Platform Fees & Deductions
            </h2>
            <div className="space-y-4">
              <SliderInput label={`Platform Fee (${platformConfig.label})`} value={platformFeePct} onChange={setPlatformFeePct} max={30} step={0.1} />
              
              {/* Refund with toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400 font-medium">Refund Rate</label>
                  <button
                    onClick={() => setUseAvgRefund(!useAvgRefund)}
                    className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition"
                  >
                    {useAvgRefund ? <ToggleRight size={16} className="text-[#F24822]" /> : <ToggleLeft size={16} />}
                    Use Average (5%)
                  </button>
                </div>
                <SliderInput label="" value={refundPct} onChange={setRefundPct} max={30} step={0.5} disabled={useAvgRefund} />
              </div>
            </div>
          </div>

          {/* Affiliate Commissions */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-gray-400" /> Affiliate Commissions
            </h2>
            <div className="space-y-4">
              <SliderInput label="Open Collab %" value={openCollab} onChange={setOpenCollab} max={50} step={0.5} />
              <SliderInput label="Target Collab %" value={targetCollab} onChange={setTargetCollab} max={50} step={0.5} />
              <SliderInput label="Ads Commission %" value={adsCommission} onChange={setAdsCommission} max={50} step={0.5} />
            </div>
            {/* Blended rate */}
            <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(155,14,229,0.1)', border: '1px solid rgba(155,14,229,0.2)' }}>
              <span className="text-xs text-gray-300 font-medium">Blended Affiliate Rate</span>
              <span className="text-sm font-bold bg-gradient-to-r from-[#9B0EE5] to-[#F57B18] bg-clip-text text-transparent">
                {calc.blendedAffiliate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Target ROAS input (only in target mode) */}
          {mode === 'target' && (
            <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(242,72,34,0.15)' }}>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#F24822]" /> Target {roasLabel}
              </h2>
              <div className="space-y-4">
                <SliderInput label={`Desired ${roasLabel}`} value={targetRoas} onChange={setTargetRoas} min={0.5} max={20} step={0.1} suffix="x" />
                <p className="text-[11px] text-gray-500">
                  At {targetRoas}x {roasLabel}, you'd spend <span className="text-white font-medium">${fmt(calc.adSpendAtTarget)}</span> on ads per ${fmt(salesPrice)} sale
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Results (2 cols) ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Profit / Unit"
              value={`$${fmt(mode === 'target' ? calc.profitAtTarget : calc.profitPerUnit)}`}
              subtext={`${fmtPct(mode === 'target' ? calc.marginAtTarget : calc.profitMargin)} margin`}
              accent
              large
            />
            <MetricCard
              label={`Breakeven ${roasLabel}`}
              value={calc.breakevenRoas === Infinity ? '∞' : `${calc.breakevenRoas.toFixed(2)}x`}
              subtext={calc.breakevenRoas === Infinity ? 'Unprofitable before ads' : `Min ${roasLabel} to break even`}
              accent
              large
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              <BreakdownRow label="Sales Price" value={calc.grossRevenue} />
              <BreakdownRow label={`Refunds (${refundPct}%)`} value={-calc.refundAmount} negative />
              <BreakdownRow label={`Platform Fee (${platformFeePct}%)`} value={-calc.platformFeeAmount} negative />
              <BreakdownRow label={`Affiliate (${calc.blendedAffiliate.toFixed(1)}%)`} value={-calc.affiliateAmount} negative />
              <div className="border-t border-white/[0.08] pt-3">
                <BreakdownRow label="Net Revenue" value={calc.netRevenue} bold />
              </div>
            </div>
          </div>

          {/* Costs Breakdown */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Costs Breakdown</h3>
            <div className="space-y-3">
              <BreakdownRow label="Product Cost (COGS)" value={-productCost} negative />
              <BreakdownRow label="Postage" value={-postage} negative />
              <BreakdownRow label="Pick & Pack" value={-pickPack} negative />
              <div className="border-t border-white/[0.08] pt-3">
                <BreakdownRow label="Total Costs" value={-calc.totalCosts} negative bold />
              </div>
            </div>
          </div>

          {/* Profit Summary */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: (mode === 'target' ? calc.profitAtTarget : calc.profitPerUnit) >= 0
                ? 'rgba(34,197,94,0.06)'
                : 'rgba(239,68,68,0.06)',
              border: (mode === 'target' ? calc.profitAtTarget : calc.profitPerUnit) >= 0
                ? '1px solid rgba(34,197,94,0.15)'
                : '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {mode === 'target' ? `Profit at ${targetRoas}x ${roasLabel}` : 'Profit (Before Ads)'}
            </h3>
            <div className="space-y-3">
              {mode === 'calculate' ? (
                <>
                  <BreakdownRow label="Net Revenue" value={calc.netRevenue} />
                  <BreakdownRow label="Total Costs" value={-calc.totalCosts} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow
                      label="Profit per Unit"
                      value={calc.profitPerUnit}
                      bold
                      highlight={calc.profitPerUnit >= 0 ? 'green' : 'red'}
                    />
                  </div>
                </>
              ) : (
                <>
                  <BreakdownRow label="Profit (before ads)" value={calc.profitPerUnit} />
                  <BreakdownRow label={`Ad Spend (${targetRoas}x ${roasLabel})`} value={-calc.adSpendAtTarget} negative />
                  <div className="border-t border-white/[0.08] pt-3">
                    <BreakdownRow
                      label="Net Profit per Unit"
                      value={calc.profitAtTarget}
                      bold
                      highlight={calc.profitAtTarget >= 0 ? 'green' : 'red'}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Visual margin bar */}
          <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Unit Economics Waterfall</h3>
            <WaterfallBar
              salesPrice={salesPrice}
              refund={calc.refundAmount}
              platformFee={calc.platformFeeAmount}
              affiliate={calc.affiliateAmount}
              cogs={productCost}
              postage={postage}
              pickPack={pickPack}
              adSpend={mode === 'target' ? calc.adSpendAtTarget : 0}
            />
          </div>
        </div>
      </div>
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
function WaterfallBar({ salesPrice, refund, platformFee, affiliate, cogs, postage, pickPack, adSpend }: {
  salesPrice: number; refund: number; platformFee: number; affiliate: number
  cogs: number; postage: number; pickPack: number; adSpend: number
}) {
  if (salesPrice <= 0) return null
  const segments = [
    { label: 'Refund', value: refund, color: '#ef4444' },
    { label: 'Platform', value: platformFee, color: '#f97316' },
    { label: 'Affiliate', value: affiliate, color: '#a855f7' },
    { label: 'COGS', value: cogs, color: '#eab308' },
    { label: 'Postage', value: postage, color: '#6366f1' },
    { label: 'P&P', value: pickPack, color: '#06b6d4' },
    ...(adSpend > 0 ? [{ label: 'Ads', value: adSpend, color: '#f43f5e' }] : []),
  ]
  const totalDeductions = segments.reduce((s, seg) => s + seg.value, 0)
  const profit = salesPrice - totalDeductions
  if (profit > 0) segments.push({ label: 'Profit', value: profit, color: '#22c55e' })

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden h-8 mb-3">
        {segments.map((seg, i) => {
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
        {segments.map((seg, i) => (
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

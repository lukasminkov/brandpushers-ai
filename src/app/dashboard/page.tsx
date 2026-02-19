'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, FileText, CheckCircle, Circle, BookOpen,
  Play, Link2, ChevronDown, ChevronRight,
  Pencil, Bell, BarChart2, Megaphone, Newspaper,
} from 'lucide-react'
import StepModal from '@/components/dashboard/StepModal'
import CompanyInfoModal from '@/components/dashboard/CompanyInfoModal'

/* ─── Types ─────────────────────────────────────── */
interface Profile {
  id: string
  full_name: string | null
  email: string | null
  brand_name: string | null
  company_name: string | null
  company_type: string | null
  ein: string | null
  company_address: string | null
  equity_percentage: number | null
  fee_amount: number | null
  equity_agreed: boolean
}

interface Phase {
  id: string; title: string; description: string | null
  banner_url: string | null; sort_order: number
}

interface Step {
  id: string; phase_id: string; title: string
  content: Record<string, unknown> | null; video_url: string | null
  resource_links: Array<{ title: string; url: string; type: string }> | null
  sort_order: number
}

interface StepProgress {
  step_id: string; completed: boolean
}

interface EquityAgreement {
  id: string; status: string; sent_at: string; signed_at: string | null
}

interface EquityStake {
  id: string; stakeholder_name: string; equity_percentage: number; stakeholder_type: string
}

/* ─── Card wrapper ───────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {children}
    </div>
  )
}

/* ─── Empty field placeholder ────────────────────── */
function Empty({ text = '—' }: { text?: string }) {
  return <span className="text-gray-600 text-sm italic">{text}</span>
}

const COLORS = ['#F24822', '#9B0EE5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

/* ════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [progress, setProgress] = useState<StepProgress[]>([])
  const [agreements, setAgreements] = useState<EquityAgreement[]>([])
  const [stakes, setStakes] = useState<EquityStake[]>([])
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [togglingStep, setTogglingStep] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Core profile fields (always exist)
    const [profileCoreRes, phasesRes, stepsRes, progressRes, agreementsRes, stakesRes] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, email, brand_name, equity_percentage, fee_amount, equity_agreed')
        .eq('id', user.id).single(),
      supabase.from('phases').select('*').order('sort_order'),
      supabase.from('phase_steps').select('*').order('sort_order'),
      supabase.from('member_step_progress').select('step_id, completed').eq('user_id', user.id),
      supabase.from('equity_agreements').select('id, status, sent_at, signed_at').eq('brand_member_id', user.id).order('created_at', { ascending: false }),
      supabase.from('equity_stakes').select('id, stakeholder_name, equity_percentage, stakeholder_type').eq('brand_member_id', user.id),
    ])

    // New company info columns (only exist after migration 003) — fetch separately
    const { data: companyData } = await supabase.from('profiles')
      .select('company_name, company_type, ein, company_address')
      .eq('id', user.id).single()

    const p = {
      ...(profileCoreRes.data || {}),
      company_name: companyData?.company_name ?? null,
      company_type: companyData?.company_type ?? null,
      ein: companyData?.ein ?? null,
      company_address: companyData?.company_address ?? null,
    } as Profile
    setProfile(p)
    const phaseList = (phasesRes.data || []) as Phase[]
    setPhases(phaseList)
    setSteps((stepsRes.data || []) as Step[])
    setProgress((progressRes.data || []) as StepProgress[])
    setAgreements((agreementsRes.data || []) as EquityAgreement[])
    setStakes((stakesRes.data || []) as EquityStake[])
    if (phaseList.length > 0) setExpandedPhases(new Set([phaseList[0].id]))
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const isCompleted = (stepId: string) => progress.some(p => p.step_id === stepId && p.completed)

  const toggleStep = async (step: Step) => {
    if (!userId || togglingStep) return
    setTogglingStep(step.id)
    const wasCompleted = isCompleted(step.id)
    setProgress(prev => {
      const existing = prev.find(p => p.step_id === step.id)
      if (existing) return prev.map(p => p.step_id === step.id ? { ...p, completed: !wasCompleted } : p)
      return [...prev, { step_id: step.id, completed: true }]
    })
    await supabase.from('member_step_progress').upsert({
      user_id: userId, step_id: step.id,
      completed: !wasCompleted,
      completed_at: !wasCompleted ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,step_id' })
    setTogglingStep(null)
  }

  const phaseSteps = (phaseId: string) => steps.filter(s => s.phase_id === phaseId)
  const phaseProgress = (phaseId: string) => {
    const ps = phaseSteps(phaseId)
    const done = ps.filter(s => isCompleted(s.id)).length
    return { done, total: ps.length, pct: ps.length > 0 ? Math.round((done / ps.length) * 100) : 0 }
  }
  const totalCompleted = steps.filter(s => isCompleted(s.id)).length
  const overallPct = steps.length > 0 ? Math.round((totalCompleted / steps.length) * 100) : 0
  const togglePhase = (id: string) => {
    setExpandedPhases(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F24822', borderTopColor: 'transparent' }} />
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const pendingAgreement = agreements.find(a => a.status === 'pending')
  const signedAgreements = agreements.filter(a => a.status === 'signed')
  const hasEquity = profile?.equity_percentage != null || stakes.length > 0
  const totalStakesPct = stakes.reduce((s, e) => s + Number(e.equity_percentage), 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* ── Header ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, <span style={{ background: 'linear-gradient(135deg, #9B0EE5, #F57B18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{firstName}</span>! 👋
        </h1>
        <p className="text-gray-500 text-sm">Here&apos;s your BrandPushers partner dashboard.</p>
      </motion.div>

      {/* ── Two-column layout ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

      {/* ── LEFT COLUMN: Company + Equity ──────────── */}
      <div className="space-y-6">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CARD 1 — Company / Project Information
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,72,34,0.1)', border: '1px solid rgba(242,72,34,0.2)' }}>
                <Building2 size={17} style={{ color: '#F24822' }} />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">Company / Project</h2>
                <p className="text-xs text-gray-500">Your entity details</p>
              </div>
            </div>
            <button
              onClick={() => setCompanyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition hover:opacity-90"
              style={{ background: 'rgba(242,72,34,0.1)', border: '1px solid rgba(242,72,34,0.2)', color: '#F24822' }}
            >
              <Pencil size={11} /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Brand / Project Name */}
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Project / Brand</p>
              {profile?.brand_name
                ? <p className="text-sm font-semibold text-white">{profile.brand_name}</p>
                : <Empty text="Not yet set" />}
            </div>

            {/* Legal Company */}
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Legal Company Name</p>
              {profile?.company_name
                ? <p className="text-sm text-white">{profile.company_name}</p>
                : <Empty text="Not yet registered" />}
            </div>

            {/* Company Type */}
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Company Type</p>
              {profile?.company_type
                ? (
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: 'rgba(155,14,229,0.12)', border: '1px solid rgba(155,14,229,0.2)', color: '#c084fc' }}>
                    {profile.company_type}
                  </span>
                )
                : <Empty text="Not yet formed" />}
            </div>

            {/* EIN */}
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">EIN</p>
              {profile?.ein
                ? <p className="text-sm text-white font-mono">{profile.ein}</p>
                : <Empty text="Not yet obtained" />}
            </div>

            {/* Registered Address */}
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Registered Address</p>
              {profile?.company_address
                ? <p className="text-sm text-white">{profile.company_address}</p>
                : <Empty text="Not yet registered" />}
            </div>

            {/* Shareholders */}
            {stakes.length > 0 && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Shareholders</p>
                <div className="flex flex-wrap gap-2">
                  {stakes.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-300">{s.stakeholder_name}</span>
                      <span className="font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{s.equity_percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CARD 3 — Equity Overview (in left column)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,72,34,0.1)', border: '1px solid rgba(242,72,34,0.2)' }}>
              <Megaphone size={17} style={{ color: '#F24822' }} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Equity Overview</h2>
              <p className="text-xs text-gray-500">Partnership & cap table</p>
            </div>
          </div>

          {!hasEquity && agreements.length === 0 ? (
            <div className="py-6 text-center text-gray-600">
              <Megaphone size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Equity details will appear once your cap table is set up.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile?.equity_percentage != null && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs text-gray-500 mb-1">BrandPushers equity stake</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{profile.equity_percentage}%</span>
                  </div>
                </div>
              )}
              {stakes.length > 0 && (
                <div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {stakes.map((s, i) => (
                      <div key={s.id} style={{ width: `${s.equity_percentage}%`, background: COLORS[i % COLORS.length], minWidth: s.equity_percentage > 0 ? 2 : 0 }} title={`${s.stakeholder_name}: ${s.equity_percentage}%`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stakes.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-[11px] text-gray-400">{s.stakeholder_name} <span className="font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{s.equity_percentage}%</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pendingAgreement && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(242,72,34,0.08)', border: '1px solid rgba(242,72,34,0.2)' }}>
                  <Bell size={14} style={{ color: '#F24822' }} className="shrink-0" />
                  <p className="text-xs text-white">Agreement pending signature</p>
                </div>
              )}
              {signedAgreements.length > 0 && (
                <div className="flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle size={12} /> {signedAgreements.length} agreement{signedAgreements.length !== 1 ? 's' : ''} signed
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* News card in left column */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <Newspaper size={17} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">News & Updates</h2>
              <p className="text-xs text-gray-500">Latest from BrandPushers</p>
            </div>
          </div>
          <div className="py-4 text-center text-gray-600">
            <p className="text-sm">No updates yet.</p>
          </div>
        </Card>
      </motion.div>

      </div>{/* end left column */}

      {/* ── RIGHT COLUMN: Program Progress ─────────── */}
      <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(155,14,229,0.1)', border: '1px solid rgba(155,14,229,0.2)' }}>
              <BarChart2 size={17} style={{ color: '#9B0EE5' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-white text-sm">Program Progress</h2>
              <p className="text-xs text-gray-500">Your journey through the program</p>
            </div>
            {steps.length > 0 && (
              <div className="text-right">
                <span className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F57B18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {overallPct}%
                </span>
                <p className="text-[10px] text-gray-600">{totalCompleted}/{steps.length} steps</p>
              </div>
            )}
          </div>

          {steps.length > 0 && (
            <div className="mb-5">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #9B0EE5, #F24822)' }}
                />
              </div>
            </div>
          )}

          {phases.length === 0 ? (
            <div className="py-8 text-center text-gray-600">
              <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No phases published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {phases.map((phase, phaseIdx) => {
                const { done, total, pct } = phaseProgress(phase.id)
                const isExpanded = expandedPhases.has(phase.id)
                const ps = phaseSteps(phase.id)
                const isPhaseComplete = total > 0 && done === total

                return (
                  <div
                    key={phase.id}
                    className="rounded-xl overflow-hidden transition-colors"
                    style={{ border: `1px solid ${isPhaseComplete ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}` }}
                  >
                    {/* Phase header */}
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/[0.03] transition text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                        style={isPhaseComplete
                          ? { background: 'rgba(74,222,128,0.15)', color: '#4ade80' }
                          : { background: 'rgba(242,72,34,0.1)', color: '#F24822' }
                        }
                      >
                        {isPhaseComplete ? <CheckCircle size={15} /> : phaseIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-white">{phase.title}</p>
                          {isPhaseComplete && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-green-400" style={{ background: 'rgba(74,222,128,0.1)' }}>
                              Complete
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #9B0EE5, #F24822)' }} />
                          </div>
                          <span className="text-[10px] text-gray-600 shrink-0">{done}/{total}</span>
                        </div>
                      </div>
                      <ChevronDown size={15} className={`text-gray-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Steps */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1 space-y-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            {ps.length === 0 ? (
                              <p className="text-xs text-gray-600 text-center py-3">No steps yet</p>
                            ) : ps.map((step, si) => {
                              const done = isCompleted(step.id)
                              const hasContent = step.content || step.video_url || (step.resource_links && step.resource_links.length > 0)
                              return (
                                <motion.div
                                  key={step.id}
                                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: si * 0.03 }}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group transition ${done ? 'bg-green-500/5' : 'hover:bg-white/[0.03]'}`}
                                >
                                  <button
                                    onClick={() => toggleStep(step)}
                                    disabled={togglingStep === step.id}
                                    className={`shrink-0 transition-transform ${togglingStep === step.id ? 'opacity-50' : 'hover:scale-110 active:scale-95'}`}
                                  >
                                    {done
                                      ? <CheckCircle size={18} className="text-green-400" />
                                      : <Circle size={18} className="text-gray-600 group-hover:text-gray-400 transition" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-sm ${done ? 'line-through text-gray-500' : 'text-white'}`}>{step.title}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {step.video_url && <Play size={9} className="text-gray-600" />}
                                      {step.resource_links && step.resource_links.length > 0 && <Link2 size={9} className="text-gray-600" />}
                                    </div>
                                  </div>
                                  {hasContent && (
                                    <button
                                      onClick={() => setSelectedStep(step)}
                                      className="shrink-0 text-xs px-2.5 py-1 rounded-lg transition text-gray-500 hover:text-white hover:bg-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                    >
                                      <ChevronRight size={11} /> View
                                    </button>
                                  )}
                                </motion.div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>
      </div>{/* end right column */}

      </div>{/* end grid */}

      {/* Step modal */}
      <StepModal step={selectedStep} onClose={() => setSelectedStep(null)} />

      {/* Company info modal */}
      <AnimatePresence>
        {companyModalOpen && profile && (
          <CompanyInfoModal
            userId={profile.id}
            initialData={{
              brand_name: profile.brand_name,
              company_name: profile.company_name,
              company_type: profile.company_type,
              ein: profile.ein,
              company_address: profile.company_address,
            }}
            onClose={() => setCompanyModalOpen(false)}
            onSaved={data => {
              setProfile(prev => prev ? { ...prev, ...data } : prev)
              setCompanyModalOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

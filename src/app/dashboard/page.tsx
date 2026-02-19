'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, Circle, Building2, FileText, ChevronDown, ChevronRight,
  BookOpen, Play, Link2
} from 'lucide-react'
import StepModal from '@/components/dashboard/StepModal'

interface Phase {
  id: string
  title: string
  description: string | null
  banner_url: string | null
  sort_order: number
}

interface Step {
  id: string
  phase_id: string
  title: string
  content: Record<string, unknown> | null
  video_url: string | null
  resource_links: Array<{ title: string; url: string; type: string }> | null
  sort_order: number
}

interface Profile {
  full_name: string | null
  brand_name: string | null
  equity_percentage: number | null
  fee_amount: number | null
  equity_agreed: boolean
}

interface StepProgress {
  step_id: string
  completed: boolean
}

export default function DashboardPage() {
  const [phases, setPhases] = useState<Phase[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [progress, setProgress] = useState<StepProgress[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [togglingStep, setTogglingStep] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [profileRes, phasesRes, stepsRes, progressRes] = await Promise.all([
      supabase.from('profiles').select('full_name, brand_name, equity_percentage, fee_amount, equity_agreed').eq('id', user.id).single(),
      supabase.from('phases').select('*').order('sort_order'),
      supabase.from('phase_steps').select('*').order('sort_order'),
      supabase.from('member_step_progress').select('step_id, completed').eq('user_id', user.id),
    ])

    setProfile(profileRes.data)
    const phaseList = (phasesRes.data || []) as Phase[]
    setPhases(phaseList)
    setSteps((stepsRes.data || []) as Step[])
    setProgress((progressRes.data || []) as StepProgress[])
    // Auto-expand first phase
    if (phaseList.length > 0) {
      setExpandedPhases(new Set([phaseList[0].id]))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const isCompleted = (stepId: string) => progress.some(p => p.step_id === stepId && p.completed)

  const toggleStep = async (step: Step) => {
    if (!userId || togglingStep) return
    setTogglingStep(step.id)
    const wasCompleted = isCompleted(step.id)
    const now = new Date().toISOString()

    // Optimistic update
    setProgress(prev => {
      const existing = prev.find(p => p.step_id === step.id)
      if (existing) {
        return prev.map(p => p.step_id === step.id ? { ...p, completed: !wasCompleted } : p)
      }
      return [...prev, { step_id: step.id, completed: true }]
    })

    await supabase.from('member_step_progress').upsert({
      user_id: userId,
      step_id: step.id,
      completed: !wasCompleted,
      completed_at: !wasCompleted ? now : null,
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
  const totalSteps = steps.length
  const overallPct = totalSteps > 0 ? Math.round((totalCompleted / totalSteps) * 100) : 0

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phaseId)) { next.delete(phaseId) } else { next.add(phaseId) }
      return next
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const hasEquityInfo = profile?.equity_percentage != null || profile?.brand_name

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome */}
      <h1 className="text-3xl font-bold mb-1">
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
      </h1>
      <p className="text-gray-400 mb-8">Your brand-building journey continues below.</p>

      {/* Equity / Partnership Card */}
      {hasEquityInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6 border border-brand-purple/20"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-logo-gradient flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Your Partnership with BrandPushers</h3>
              {profile?.brand_name && <p className="text-brand-orange font-medium mb-2">{profile.brand_name}</p>}
              {profile?.equity_percentage != null && (
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-white">{profile.equity_percentage}%</span>
                  <span className="text-gray-400 text-sm">BrandPushers equity stake</span>
                </div>
              )}
              {profile?.equity_percentage != null && (
                <div className="rounded-xl bg-black/20 border border-white/10 p-4 mb-3">
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-brand-orange mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-400 leading-relaxed">
                      <strong className="text-white">BrandPushers (WHUT.AI LLC)</strong> holds{' '}
                      <strong className="text-brand-orange">{profile.equity_percentage}%</strong> equity in{' '}
                      <strong className="text-white">{profile.brand_name || 'your company'}</strong>.{' '}
                      Ensure this is reflected in your operating agreement and cap table.
                    </p>
                  </div>
                </div>
              )}
              {profile?.fee_amount != null && (
                <p className="text-sm text-gray-500">Program fee: <span className="text-gray-300 font-medium">${profile.fee_amount.toLocaleString()} USD</span></p>
              )}
              {profile?.equity_agreed && (
                <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                  <CheckCircle size={14} /><span>Equity terms confirmed</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Overall Progress */}
      {totalSteps > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Overall Progress</h3>
              <p className="text-gray-500 text-sm">{totalCompleted} of {totalSteps} steps completed</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold bg-logo-gradient bg-clip-text text-transparent">{overallPct}%</span>
            </div>
          </div>
          <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-logo-gradient rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Phases */}
      {phases.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>No phases published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase, phaseIdx) => {
            const { done, total, pct } = phaseProgress(phase.id)
            const isExpanded = expandedPhases.has(phase.id)
            const ps = phaseSteps(phase.id)
            const isPhaseComplete = total > 0 && done === total

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: phaseIdx * 0.06 }}
                className={`glass rounded-2xl overflow-hidden border transition-colors ${isPhaseComplete ? 'border-green-500/30' : 'border-white/10'}`}
              >
                {/* Phase Banner */}
                {phase.banner_url && (
                  <div className="h-32 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={phase.banner_url} alt={phase.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]/80" />
                  </div>
                )}

                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full px-6 py-5 flex items-center gap-4 hover:bg-white/5 transition text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${isPhaseComplete ? 'bg-green-500/20 text-green-400' : 'bg-brand-orange/20 text-brand-orange'}`}>
                    {isPhaseComplete ? <CheckCircle size={18} /> : phaseIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{phase.title}</h3>
                      {isPhaseComplete && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Complete!</span>
                      )}
                    </div>
                    {phase.description && (
                      <p className="text-gray-500 text-sm mt-0.5 truncate">{phase.description}</p>
                    )}
                    {/* Mini progress bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-logo-gradient rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{done}/{total}</span>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Steps */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-1.5 border-t border-white/5 pt-3">
                        {ps.length === 0 ? (
                          <p className="text-sm text-gray-600 text-center py-4">No steps in this phase yet</p>
                        ) : (
                          ps.map((step, stepIdx) => {
                            const done = isCompleted(step.id)
                            const hasContent = step.content || step.video_url || (step.resource_links && step.resource_links.length > 0)
                            return (
                              <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: stepIdx * 0.04 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition group ${done ? 'bg-green-500/5' : 'hover:bg-white/5'}`}
                              >
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleStep(step)}
                                  disabled={togglingStep === step.id}
                                  className={`flex-shrink-0 transition-transform ${togglingStep === step.id ? 'opacity-50' : 'hover:scale-110 active:scale-95'}`}
                                >
                                  {done ? (
                                    <CheckCircle size={22} className="text-green-400" />
                                  ) : (
                                    <Circle size={22} className="text-gray-600 group-hover:text-gray-400 transition" />
                                  )}
                                </button>

                                {/* Step info */}
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm font-medium ${done ? 'line-through text-gray-500' : 'text-white'}`}>
                                    {step.title}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {step.video_url && <Play size={10} className="text-gray-600" />}
                                    {step.resource_links && step.resource_links.length > 0 && <Link2 size={10} className="text-gray-600" />}
                                    {step.video_url && <span className="text-xs text-gray-600">Video</span>}
                                    {step.resource_links && step.resource_links.length > 0 && (
                                      <span className="text-xs text-gray-600">{step.resource_links.length} resource{step.resource_links.length !== 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Open step button */}
                                {hasContent && (
                                  <button
                                    onClick={() => setSelectedStep(step)}
                                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10 transition text-gray-400 hover:text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                                  >
                                    <ChevronRight size={12} /> View
                                  </button>
                                )}
                              </motion.div>
                            )
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Step Modal */}
      <StepModal step={selectedStep} onClose={() => setSelectedStep(null)} />
    </div>
  )
}

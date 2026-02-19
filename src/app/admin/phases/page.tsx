'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import PhaseModal from '@/components/admin/PhaseModal'
import StepEditorModal from '@/components/admin/StepEditorModal'
import AdminModal from '@/components/admin/AdminModal'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Pencil, BarChart2,
  Layers, BookOpen, Play, Link2, GripVertical, ChevronRight,
  AlertTriangle,
} from 'lucide-react'

interface Phase {
  id: string
  title: string
  description: string | null
  banner_url: string | null
  sort_order: number
  created_at?: string
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

interface MemberProgress {
  user_id: string
  email: string
  full_name: string | null
  completed_steps: string[]
  total_steps: number
}

export default function PhasesAdminPage() {
  const supabase = createClient()

  /* ─ Data ─────────────────────────────────────────── */
  const [phases,   setPhases]   = useState<Phase[]>([])
  const [steps,    setSteps]    = useState<Record<string, Step[]>>({})  // keyed by phase_id
  const [progress, setProgress] = useState<MemberProgress[]>([])
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState<'builder' | 'progress'>('builder')

  /* ─ Expand state ─────────────────────────────────── */
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)

  /* ─ Modal state ──────────────────────────────────── */
  const [phaseModal,    setPhaseModal]    = useState<{ open: boolean; phase: Phase | null }>({ open: false, phase: null })
  const [stepModal,     setStepModal]     = useState<{ open: boolean; step: Step | null; phaseId: string }>({ open: false, step: null, phaseId: '' })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'phase' | 'step'; id: string; name: string } | null>(null)

  /* ─ Load ─────────────────────────────────────────── */
  const loadPhases = async () => {
    const { data } = await supabase.from('phases').select('*').order('sort_order')
    setPhases((data || []) as Phase[])
    setLoading(false)
  }

  const loadStepsForPhase = async (phaseId: string) => {
    const { data } = await supabase.from('phase_steps').select('*').eq('phase_id', phaseId).order('sort_order')
    setSteps(prev => ({ ...prev, [phaseId]: (data || []) as Step[] }))
  }

  const loadProgress = async () => {
    const { data: allSteps } = await supabase.from('phase_steps').select('id')
    const total = allSteps?.length || 0
    const { data: members } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'member')
    if (!members) { setProgress([]); return }
    const { data: prog } = await supabase.from('member_step_progress').select('user_id, step_id').eq('completed', true)
    const map: Record<string, string[]> = {}
    for (const p of prog || []) {
      if (!map[p.user_id]) map[p.user_id] = []
      map[p.user_id].push(p.step_id)
    }
    setProgress(members.map(m => ({
      user_id: m.id, email: m.email || '', full_name: m.full_name,
      completed_steps: map[m.id] || [], total_steps: total,
    })))
  }

  useEffect(() => { loadPhases() }, [])
  useEffect(() => { if (activeTab === 'progress') loadProgress() }, [activeTab])

  /* Expand phase and lazy-load its steps */
  const togglePhase = (id: string) => {
    if (expandedPhase === id) {
      setExpandedPhase(null)
    } else {
      setExpandedPhase(id)
      if (!steps[id]) loadStepsForPhase(id)
    }
  }

  /* ─ Reorder ──────────────────────────────────────── */
  const movePhase = async (phase: Phase, dir: -1 | 1) => {
    const idx = phases.findIndex(p => p.id === phase.id)
    const target = phases[idx + dir]
    if (!target) return
    await supabase.from('phases').update({ sort_order: target.sort_order }).eq('id', phase.id)
    await supabase.from('phases').update({ sort_order: phase.sort_order }).eq('id', target.id)
    loadPhases()
  }

  const moveStep = async (step: Step, dir: -1 | 1) => {
    const list = steps[step.phase_id] || []
    const idx = list.findIndex(s => s.id === step.id)
    const target = list[idx + dir]
    if (!target) return
    await supabase.from('phase_steps').update({ sort_order: target.sort_order }).eq('id', step.id)
    await supabase.from('phase_steps').update({ sort_order: step.sort_order }).eq('id', target.id)
    loadStepsForPhase(step.phase_id)
  }

  /* ─ Delete ───────────────────────────────────────── */
  const confirmDelete = (type: 'phase' | 'step', id: string, name: string) => {
    setDeleteConfirm({ open: true, type, id, name })
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'phase') {
      await supabase.from('phases').delete().eq('id', deleteConfirm.id)
      if (expandedPhase === deleteConfirm.id) setExpandedPhase(null)
      setSteps(prev => { const n = { ...prev }; delete n[deleteConfirm.id]; return n })
      loadPhases()
    } else {
      const step = Object.values(steps).flat().find(s => s.id === deleteConfirm.id)
      await supabase.from('phase_steps').delete().eq('id', deleteConfirm.id)
      if (step) loadStepsForPhase(step.phase_id)
    }
    setDeleteConfirm(null)
  }

  /* ─ Phase saved callback ─────────────────────────── */
  const onPhaseSaved = (saved: Phase) => {
    setPhases(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) return prev.map(p => p.id === saved.id ? saved : p)
      return [...prev, saved].sort((a, b) => a.sort_order - b.sort_order)
    })
  }

  /* ─ Step saved callback ──────────────────────────── */
  const onStepSaved = (saved: Step) => {
    setSteps(prev => {
      const list = prev[saved.phase_id] || []
      const idx = list.findIndex(s => s.id === saved.id)
      if (idx >= 0) return { ...prev, [saved.phase_id]: list.map(s => s.id === saved.id ? saved : s) }
      return { ...prev, [saved.phase_id]: [...list, saved] }
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalStepCount = Object.values(steps).reduce((acc, s) => acc + s.length, 0)

  return (
    <>
      {/* ── Page ── */}
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Course Builder</h1>
            <p className="text-gray-500 mt-1">
              {phases.length} phase{phases.length !== 1 ? 's' : ''} · {totalStepCount} step{totalStepCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
              <button
                onClick={() => setActiveTab('builder')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'builder' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Layers size={13} /> Builder
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'progress' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <BarChart2 size={13} /> Progress
              </button>
            </div>
            {activeTab === 'builder' && (
              <button
                onClick={() => setPhaseModal({ open: true, phase: null })}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                <Plus size={14} /> New Phase
              </button>
            )}
          </div>
        </div>

        {/* ── Progress Tab ── */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            {progress.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-gray-500">
                <BarChart2 size={36} className="mx-auto mb-3 opacity-30" />
                No members yet
              </div>
            ) : (
              progress.map(m => {
                const pct = m.total_steps > 0 ? Math.round((m.completed_steps.length / m.total_steps) * 100) : 0
                return (
                  <div key={m.user_id} className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{m.full_name || m.email}</p>
                        <p className="text-gray-500 text-sm">{m.email}</p>
                      </div>
                      <span className="text-brand-orange font-bold text-lg">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full bg-logo-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-gray-500 text-xs mt-1.5">{m.completed_steps.length} of {m.total_steps} steps completed</p>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Builder Tab ── */}
        {activeTab === 'builder' && (
          <div className="space-y-3">
            {phases.length === 0 && (
              <div className="glass rounded-2xl p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} className="text-brand-orange/60" />
                </div>
                <p className="text-lg font-semibold text-white mb-1">No phases yet</p>
                <p className="text-gray-500 text-sm mb-6">Create your first phase to start building the member journey.</p>
                <button
                  onClick={() => setPhaseModal({ open: true, phase: null })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange rounded-xl text-sm font-semibold hover:opacity-90 transition"
                >
                  <Plus size={14} /> Create First Phase
                </button>
              </div>
            )}

            {phases.map((phase, phaseIdx) => {
              const phaseSteps = steps[phase.id] || []
              const isOpen = expandedPhase === phase.id
              const stepCount = phaseSteps.length

              return (
                <motion.div
                  key={phase.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: phaseIdx * 0.04 }}
                  className={`rounded-2xl border transition-colors overflow-hidden ${isOpen ? 'border-brand-orange/30 bg-[#111]' : 'border-white/8 bg-[#111] hover:border-white/15'}`}
                >
                  {/* Phase Banner (when expanded + has banner) */}
                  {isOpen && phase.banner_url && (
                    <div className="h-28 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={phase.banner_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111]" />
                    </div>
                  )}

                  {/* Phase Row */}
                  <div className="flex items-center gap-3 px-5 py-4">
                    {/* Drag handle + index */}
                    <div className="flex items-center gap-2 flex-shrink-0 text-gray-600">
                      <GripVertical size={14} />
                      <span className="text-xs font-mono w-4 text-center">{phaseIdx + 1}</span>
                    </div>

                    {/* Expand toggle */}
                    <button onClick={() => togglePhase(phase.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{phase.title}</p>
                        {phase.description && (
                          <p className="text-gray-500 text-xs mt-0.5 truncate">{phase.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">{stepCount} step{stepCount !== 1 ? 's' : ''}</span>
                      <ChevronRight size={16} className={`text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => movePhase(phase, -1)}
                        disabled={phaseIdx === 0}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => movePhase(phase, 1)}
                        disabled={phaseIdx === phases.length - 1}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => setPhaseModal({ open: true, phase })}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete('phase', phase.id, phase.title)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Steps (expanded) */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/6 pb-3">
                          {phaseSteps.map((step, stepIdx) => (
                            <div
                              key={step.id}
                              className="group flex items-center gap-3 px-5 py-3 hover:bg-white/4 transition"
                            >
                              {/* Step index */}
                              <span className="text-xs font-mono text-gray-600 w-5 text-center flex-shrink-0">
                                {stepIdx + 1}
                              </span>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/90 truncate">{step.title}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {step.content && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                      <BookOpen size={9} /> Content
                                    </span>
                                  )}
                                  {step.video_url && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                      <Play size={9} /> Video
                                    </span>
                                  )}
                                  {step.resource_links && step.resource_links.length > 0 && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                      <Link2 size={9} /> {step.resource_links.length} resource{step.resource_links.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Step actions */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                <button onClick={() => moveStep(step, -1)} disabled={stepIdx === 0} className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition disabled:opacity-20">
                                  <ChevronUp size={12} />
                                </button>
                                <button onClick={() => moveStep(step, 1)} disabled={stepIdx === phaseSteps.length - 1} className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition disabled:opacity-20">
                                  <ChevronDown size={12} />
                                </button>
                                <button
                                  onClick={() => setStepModal({ open: true, step, phaseId: phase.id })}
                                  className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => confirmDelete('step', step.id, step.title)}
                                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add step row */}
                          <button
                            onClick={() => setStepModal({ open: true, step: null, phaseId: phase.id })}
                            className="w-full flex items-center gap-2 px-5 py-3 text-sm text-gray-600 hover:text-brand-orange hover:bg-brand-orange/5 transition border-t border-dashed border-white/6"
                          >
                            <Plus size={13} />
                            Add step to &ldquo;{phase.title}&rdquo;
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Phase create/edit modal */}
      <PhaseModal
        open={phaseModal.open}
        onClose={() => setPhaseModal({ open: false, phase: null })}
        phase={phaseModal.phase}
        nextSortOrder={phases.length}
        onSaved={onPhaseSaved}
      />

      {/* Step create/edit modal */}
      <StepEditorModal
        open={stepModal.open}
        onClose={() => setStepModal({ open: false, step: null, phaseId: '' })}
        step={stepModal.step}
        phaseId={stepModal.phaseId}
        nextSortOrder={(steps[stepModal.phaseId] || []).length}
        onSaved={onStepSaved}
      />

      {/* Delete confirm modal */}
      <AdminModal
        open={!!deleteConfirm?.open}
        onClose={() => setDeleteConfirm(null)}
        title={`Delete ${deleteConfirm?.type === 'phase' ? 'Phase' : 'Step'}?`}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/8 transition">
              Cancel
            </button>
            <button onClick={executeDelete} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition">
              Delete
            </button>
          </div>
        }
      >
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-300">
              Are you sure you want to delete{' '}
              <span className="text-white font-semibold">&ldquo;{deleteConfirm?.name}&rdquo;</span>?
            </p>
            {deleteConfirm?.type === 'phase' && (
              <p className="text-xs text-gray-500 mt-2">This will permanently delete all steps inside this phase and member progress data.</p>
            )}
            <p className="text-xs text-gray-600 mt-1">This action cannot be undone.</p>
          </div>
        </div>
      </AdminModal>
    </>
  )
}

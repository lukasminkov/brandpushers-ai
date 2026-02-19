'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import TiptapEditor from '@/components/admin/TiptapEditor'
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, X, Save,
  Upload, Play, Link2, BarChart2, GripVertical, Eye
} from 'lucide-react'

interface Phase {
  id: string
  title: string
  description: string | null
  banner_url: string | null
  sort_order: number
  created_at: string
}

interface Step {
  id: string
  phase_id: string
  title: string
  content: Record<string, unknown> | null
  video_url: string | null
  resource_links: ResourceLink[] | null
  sort_order: number
}

interface ResourceLink {
  title: string
  url: string
  type: string
}

interface MemberProgress {
  user_id: string
  email: string
  full_name: string | null
  completed_steps: string[]
  total_steps: number
}

export default function PhasesAdminPage() {
  const [phases, setPhases] = useState<Phase[]>([])
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [activeTab, setActiveTab] = useState<'phases' | 'progress'>('phases')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<MemberProgress[]>([])
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const bannerRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Phase form state
  const [phaseTitle, setPhaseTitle] = useState('')
  const [phaseDesc, setPhaseDesc] = useState('')
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null)

  // Step form state
  const [stepTitle, setStepTitle] = useState('')
  const [stepContent, setStepContent] = useState<Record<string, unknown> | null>(null)
  const [stepVideoUrl, setStepVideoUrl] = useState('')
  const [stepLinks, setStepLinks] = useState<ResourceLink[]>([])

  const loadPhases = async () => {
    const { data } = await supabase.from('phases').select('*').order('sort_order')
    setPhases((data || []) as Phase[])
    setLoading(false)
  }

  const loadSteps = async (phaseId: string) => {
    const { data } = await supabase.from('phase_steps').select('*').eq('phase_id', phaseId).order('sort_order')
    setSteps((data || []) as Step[])
  }

  const loadProgress = async () => {
    // Get all phase steps
    const { data: allSteps } = await supabase.from('phase_steps').select('id')
    const totalSteps = allSteps?.length || 0

    // Get all members + their progress
    const { data: members } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'member')
    if (!members) { setProgress([]); return }

    const { data: progressData } = await supabase.from('member_step_progress').select('user_id, step_id').eq('completed', true)
    
    const progressMap: Record<string, string[]> = {}
    for (const p of progressData || []) {
      if (!progressMap[p.user_id]) progressMap[p.user_id] = []
      progressMap[p.user_id].push(p.step_id)
    }

    setProgress(members.map(m => ({
      user_id: m.id,
      email: m.email || '',
      full_name: m.full_name,
      completed_steps: progressMap[m.id] || [],
      total_steps: totalSteps,
    })))
  }

  useEffect(() => { loadPhases() }, [])
  useEffect(() => { if (activeTab === 'progress') loadProgress() }, [activeTab])

  const selectPhase = (p: Phase) => {
    setSelectedPhase(p)
    setPhaseTitle(p.title)
    setPhaseDesc(p.description || '')
    setPhaseBanner(p.banner_url)
    setSelectedStep(null)
    loadSteps(p.id)
  }

  const selectStep = (s: Step) => {
    setSelectedStep(s)
    setStepTitle(s.title)
    setStepContent(s.content)
    setStepVideoUrl(s.video_url || '')
    setStepLinks(s.resource_links || [])
  }

  const addPhase = async () => {
    const maxOrder = phases.length > 0 ? Math.max(...phases.map(p => p.sort_order)) : -1
    const { data } = await supabase.from('phases').insert({ title: 'New Phase', sort_order: maxOrder + 1 }).select().single()
    if (data) { await loadPhases(); selectPhase(data as Phase) }
  }

  const savePhase = async () => {
    if (!selectedPhase) return
    setSaving(true)
    await supabase.from('phases').update({
      title: phaseTitle,
      description: phaseDesc || null,
      banner_url: phaseBanner,
    }).eq('id', selectedPhase.id)
    setSelectedPhase({ ...selectedPhase, title: phaseTitle, description: phaseDesc, banner_url: phaseBanner })
    await loadPhases()
    setSaving(false)
  }

  const deletePhase = async (id: string) => {
    if (!confirm('Delete this phase and all its steps?')) return
    await supabase.from('phases').delete().eq('id', id)
    if (selectedPhase?.id === id) { setSelectedPhase(null); setSteps([]) }
    await loadPhases()
  }

  const movePhase = async (phase: Phase, dir: -1 | 1) => {
    const idx = phases.findIndex(p => p.id === phase.id)
    const target = phases[idx + dir]
    if (!target) return
    await supabase.from('phases').update({ sort_order: target.sort_order }).eq('id', phase.id)
    await supabase.from('phases').update({ sort_order: phase.sort_order }).eq('id', target.id)
    await loadPhases()
  }

  const uploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedPhase) return
    setUploadingBanner(true)
    const ext = file.name.split('.').pop()
    const path = `phases/${selectedPhase.id}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
      setPhaseBanner(publicUrl)
    }
    setUploadingBanner(false)
  }

  const addStep = async () => {
    if (!selectedPhase) return
    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.sort_order)) : -1
    const { data } = await supabase.from('phase_steps').insert({
      phase_id: selectedPhase.id, title: 'New Step', sort_order: maxOrder + 1
    }).select().single()
    if (data) { await loadSteps(selectedPhase.id); selectStep(data as Step) }
  }

  const saveStep = async () => {
    if (!selectedStep) return
    setSaving(true)
    await supabase.from('phase_steps').update({
      title: stepTitle,
      content: stepContent,
      video_url: stepVideoUrl || null,
      resource_links: stepLinks.length > 0 ? stepLinks : null,
    }).eq('id', selectedStep.id)
    if (selectedPhase) await loadSteps(selectedPhase.id)
    setSaving(false)
  }

  const deleteStep = async (id: string) => {
    if (!confirm('Delete this step?')) return
    await supabase.from('phase_steps').delete().eq('id', id)
    if (selectedStep?.id === id) setSelectedStep(null)
    if (selectedPhase) await loadSteps(selectedPhase.id)
  }

  const moveStep = async (step: Step, dir: -1 | 1) => {
    const idx = steps.findIndex(s => s.id === step.id)
    const target = steps[idx + dir]
    if (!target) return
    await supabase.from('phase_steps').update({ sort_order: target.sort_order }).eq('id', step.id)
    await supabase.from('phase_steps').update({ sort_order: step.sort_order }).eq('id', target.id)
    if (selectedPhase) await loadSteps(selectedPhase.id)
  }

  const addLink = () => setStepLinks(prev => [...prev, { title: '', url: '', type: 'link' }])
  const updateLink = (i: number, key: keyof ResourceLink, val: string) => {
    setStepLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l))
  }
  const removeLink = (i: number) => setStepLinks(prev => prev.filter((_, idx) => idx !== i))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Phase & Course Builder</h1>
          <p className="text-gray-500 mt-1">Build the member journey step by step</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('phases')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'phases' ? 'bg-brand-orange text-white' : 'glass text-gray-400 hover:text-white'}`}
          >
            <GripVertical size={14} className="inline mr-1.5" />Phases
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'progress' ? 'bg-brand-orange text-white' : 'glass text-gray-400 hover:text-white'}`}
          >
            <BarChart2 size={14} className="inline mr-1.5" />Progress
          </button>
        </div>
      </div>

      {activeTab === 'progress' ? (
        /* ── Progress View ── */
        <div>
          <h2 className="text-xl font-semibold mb-4">Member Progress</h2>
          {progress.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-gray-500">No members yet</div>
          ) : (
            <div className="space-y-4">
              {progress.map(m => {
                const pct = m.total_steps > 0 ? Math.round((m.completed_steps.length / m.total_steps) * 100) : 0
                return (
                  <div key={m.user_id} className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{m.full_name || m.email}</p>
                        <p className="text-gray-500 text-sm">{m.email}</p>
                      </div>
                      <span className="text-brand-orange font-bold">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-logo-gradient rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1.5">{m.completed_steps.length} of {m.total_steps} steps completed</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Phases & Steps Builder ── */
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Phase List */}
          <div className="w-72 flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-300">Phases</h2>
              <button onClick={addPhase} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-brand-orange rounded-lg hover:opacity-90 transition">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {phases.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => selectPhase(p)}
                  className={`group glass rounded-xl p-3 cursor-pointer transition border ${selectedPhase?.id === p.id ? 'border-brand-orange/50 bg-brand-orange/5' : 'border-transparent hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{p.title}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={e => { e.stopPropagation(); movePhase(p, -1) }} className="p-1 hover:text-white text-gray-500 disabled:opacity-20" disabled={i === 0}>
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); movePhase(p, 1) }} className="p-1 hover:text-white text-gray-500" disabled={i === phases.length - 1}>
                        <ChevronDown size={12} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deletePhase(p.id) }} className="p-1 text-red-400 hover:text-red-300">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {phases.length === 0 && (
                <div className="text-center text-gray-600 py-8 text-sm">No phases yet</div>
              )}
            </div>
          </div>

          {/* Phase Editor */}
          {selectedPhase ? (
            <div className="flex-1 flex gap-5 min-w-0">
              {/* Phase Details + Steps */}
              <div className="w-64 flex-shrink-0 flex flex-col gap-4">
                {/* Phase Details */}
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-semibold text-sm text-gray-300 mb-3">Phase Details</h3>
                  <div className="space-y-3">
                    <input
                      value={phaseTitle}
                      onChange={e => setPhaseTitle(e.target.value)}
                      className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                      placeholder="Phase title"
                    />
                    <textarea
                      value={phaseDesc}
                      onChange={e => setPhaseDesc(e.target.value)}
                      className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange resize-none h-20"
                      placeholder="Description (optional)"
                    />
                    {/* Banner Upload */}
                    <div>
                      {phaseBanner && (
                        <div className="mb-2 rounded-lg overflow-hidden h-20 bg-dark-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={phaseBanner} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input type="file" ref={bannerRef} accept="image/*" className="hidden" onChange={uploadBanner} />
                      <button
                        onClick={() => bannerRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs glass rounded-lg hover:bg-white/10 transition"
                        disabled={uploadingBanner}
                      >
                        <Upload size={12} />
                        {uploadingBanner ? 'Uploading…' : phaseBanner ? 'Change Banner' : 'Upload Banner'}
                      </button>
                    </div>
                    <button
                      onClick={savePhase}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-brand-orange rounded-lg text-sm font-semibold hover:opacity-90 transition"
                    >
                      <Save size={12} /> {saving ? 'Saving…' : 'Save Phase'}
                    </button>
                  </div>
                </div>

                {/* Steps List */}
                <div className="glass rounded-2xl p-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-gray-300">Steps</h3>
                    <button onClick={addStep} className="flex items-center gap-1 text-xs px-2 py-1 bg-brand-orange/20 text-brand-orange rounded-lg hover:bg-brand-orange/30 transition">
                      <Plus size={10} /> Add
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    {steps.map((s, i) => (
                      <div
                        key={s.id}
                        onClick={() => selectStep(s)}
                        className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition border ${selectedStep?.id === s.id ? 'border-brand-orange/50 bg-brand-orange/5' : 'border-transparent hover:bg-white/5'}`}
                      >
                        <span className="text-xs text-gray-500 w-4 text-center">{i + 1}</span>
                        <span className="flex-1 text-xs truncate">{s.title}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={e => { e.stopPropagation(); moveStep(s, -1) }} className="p-0.5 hover:text-white text-gray-500" disabled={i === 0}>
                            <ChevronUp size={10} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); moveStep(s, 1) }} className="p-0.5 hover:text-white text-gray-500" disabled={i === steps.length - 1}>
                            <ChevronDown size={10} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteStep(s.id) }} className="p-0.5 text-red-400 hover:text-red-300">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {steps.length === 0 && (
                      <p className="text-xs text-gray-600 text-center py-4">No steps yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step Editor */}
              {selectedStep ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="glass rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Edit Step</h3>
                      <button
                        onClick={saveStep}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-orange rounded-xl text-sm font-semibold hover:opacity-90 transition"
                      >
                        <Save size={14} /> {saving ? 'Saving…' : 'Save Step'}
                      </button>
                    </div>

                    <input
                      value={stepTitle}
                      onChange={e => setStepTitle(e.target.value)}
                      className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-orange"
                      placeholder="Step title"
                    />

                    {/* Rich Text Editor */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Content (rich text)</label>
                      <TiptapEditor
                        key={selectedStep.id}
                        content={stepContent}
                        onChange={setStepContent}
                      />
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 flex items-center gap-1.5"><Play size={12} />Video URL (YouTube)</label>
                      <input
                        value={stepVideoUrl}
                        onChange={e => setStepVideoUrl(e.target.value)}
                        className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-orange text-sm"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>

                    {/* Resource Links */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-400 flex items-center gap-1.5"><Link2 size={12} />Resource Links</label>
                        <button onClick={addLink} className="text-xs text-brand-orange hover:underline">+ Add Link</button>
                      </div>
                      <div className="space-y-2">
                        {stepLinks.map((link, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input
                              value={link.title}
                              onChange={e => updateLink(i, 'title', e.target.value)}
                              className="flex-1 bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                              placeholder="Link title"
                            />
                            <input
                              value={link.url}
                              onChange={e => updateLink(i, 'url', e.target.value)}
                              className="flex-1 bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                              placeholder="https://..."
                            />
                            <select
                              value={link.type}
                              onChange={e => updateLink(i, 'type', e.target.value)}
                              className="bg-dark-700 border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-brand-orange"
                            >
                              <option value="link">Link</option>
                              <option value="pdf">PDF</option>
                              <option value="video">Video</option>
                              <option value="doc">Doc</option>
                              <option value="template">Template</option>
                            </select>
                            <button onClick={() => removeLink(i)} className="text-red-400 hover:text-red-300 p-1">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <ChevronRight size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Select a step to edit it</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <Eye size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">Select a phase to edit</p>
                <p className="text-sm mt-1">Or create a new one →</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Save, ChevronDown, ChevronUp, DollarSign, Percent,
  Building2, CheckCircle, Calendar, MapPin, User, Sparkles, AlertCircle
} from 'lucide-react'

interface Member {
  id: string
  email: string
  full_name: string
  approved_at: string
  brand_name: string | null
  equity_percentage: number | null
  fee_amount: number | null
  equity_agreed: boolean
  date_of_birth: string | null
  residential_address: string | null
  onboarding_completed: boolean
  member_phases?: { status: string; phases: { name: string } }[]
}

interface EditState {
  brand_name: string
  equity_percentage: string
  fee_amount: string
  equity_agreed: boolean
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editMap, setEditMap] = useState<Record<string, EditState>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, member_phases(status, phases(name))')
        .eq('role', 'member')
        .order('approved_at', { ascending: false })
      const memberList = (data || []) as Member[]
      setMembers(memberList)
      const map: Record<string, EditState> = {}
      memberList.forEach(m => {
        map[m.id] = {
          brand_name: m.brand_name || '',
          equity_percentage: m.equity_percentage != null ? String(m.equity_percentage) : '',
          fee_amount: m.fee_amount != null ? String(m.fee_amount) : '',
          equity_agreed: m.equity_agreed || false,
        }
      })
      setEditMap(map)
      setLoading(false)
    })()
  }, [supabase])

  const handleEdit = (id: string, field: keyof EditState, value: string | boolean) => {
    setEditMap(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const handleSave = async (id: string) => {
    setSaving(id)
    const edit = editMap[id]
    const { error } = await supabase
      .from('profiles')
      .update({
        brand_name: edit.brand_name || null,
        equity_percentage: edit.equity_percentage ? parseFloat(edit.equity_percentage) : null,
        fee_amount: edit.fee_amount ? parseFloat(edit.fee_amount) : null,
        equity_agreed: edit.equity_agreed,
      })
      .eq('id', id)
    setSaving(null)
    if (!error) {
      setMembers(prev =>
        prev.map(m =>
          m.id === id
            ? {
                ...m,
                brand_name: edit.brand_name || null,
                equity_percentage: edit.equity_percentage ? parseFloat(edit.equity_percentage) : null,
                fee_amount: edit.fee_amount ? parseFloat(edit.fee_amount) : null,
                equity_agreed: edit.equity_agreed,
              }
            : m
        )
      )
      setSaved(id)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F24822 transparent transparent transparent' }} />
      </div>
    )
  }

  const onboardedCount = members.filter(m => m.onboarding_completed).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-gray-500 text-sm mt-1">
            {members.length} approved member{members.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-green-400">{onboardedCount} onboarded</span>
            {onboardedCount < members.length && (
              <span className="text-yellow-500"> · {members.length - onboardedCount} pending onboarding</span>
            )}
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">No approved members yet</div>
      ) : (
        <div className="space-y-3">
          {members.map(m => {
            const isOpen = expandedId === m.id
            const edit = editMap[m.id] || {
              brand_name: '',
              equity_percentage: '',
              fee_amount: '',
              equity_agreed: false,
            }
            const isSaving = saving === m.id
            const wasSaved = saved === m.id

            return (
              <motion.div key={m.id} layout className="glass rounded-2xl overflow-hidden">
                {/* Header row */}
                <div
                  className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isOpen ? null : m.id)}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
                  >
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{m.full_name || 'Unknown'}</h3>
                      {m.onboarding_completed ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 flex items-center gap-1">
                          <CheckCircle size={10} /> Onboarded
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 flex items-center gap-1">
                          <AlertCircle size={10} /> Pending Onboarding
                        </span>
                      )}
                      {m.equity_agreed && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 flex items-center gap-1">
                          <Sparkles size={10} /> Terms Agreed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm truncate">{m.email}</p>
                    {m.brand_name && (
                      <p className="text-xs mt-0.5" style={{ color: '#F24822' }}>{m.brand_name}</p>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="hidden md:flex items-center gap-4 text-sm text-gray-400 shrink-0">
                    {m.equity_percentage != null && (
                      <span className="flex items-center gap-1">
                        <Percent size={12} className="text-purple-400" />
                        <span className="text-white font-medium">{m.equity_percentage}%</span>
                        <span className="text-gray-600">equity</span>
                      </span>
                    )}
                    {m.fee_amount != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} style={{ color: '#F24822' }} />
                        <span className="text-white font-medium">{m.fee_amount.toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  {isOpen ? (
                    <ChevronUp size={18} className="text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500 shrink-0" />
                  )}
                </div>

                {/* Expanded panel */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-6 border-t pt-5"
                        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                      >
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Left: Equity Fields */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <Building2 size={14} /> Equity & Program
                            </h4>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Brand / Company Name</label>
                              <input
                                type="text"
                                value={edit.brand_name}
                                onChange={e => handleEdit(m.id, 'brand_name', e.target.value)}
                                placeholder="e.g. Glow Cosmetics LLC"
                                className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1">BrandPushers Equity Stake (%)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={edit.equity_percentage}
                                  onChange={e => handleEdit(m.id, 'equity_percentage', e.target.value)}
                                  placeholder="e.g. 15"
                                  className="w-full rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Program Fee (USD)</label>
                              <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                  type="number"
                                  min="0"
                                  step="500"
                                  value={edit.fee_amount}
                                  onChange={e => handleEdit(m.id, 'fee_amount', e.target.value)}
                                  placeholder="e.g. 15000"
                                  className="w-full rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEdit(m.id, 'equity_agreed', !edit.equity_agreed)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${
                                  edit.equity_agreed ? 'bg-green-500' : 'border border-white/10'
                                }`}
                                style={!edit.equity_agreed ? { background: 'rgba(255,255,255,0.06)' } : {}}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                    edit.equity_agreed ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <label
                                className="text-sm text-gray-300 cursor-pointer"
                                onClick={() => handleEdit(m.id, 'equity_agreed', !edit.equity_agreed)}
                              >
                                Equity terms confirmed
                              </label>
                            </div>

                            <button
                              onClick={() => handleSave(m.id)}
                              disabled={isSaving}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                                wasSaved
                                  ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                                  : 'border text-orange-400 hover:bg-orange-500/10'
                              }`}
                              style={!wasSaved ? { borderColor: 'rgba(242,72,34,0.3)', background: 'rgba(242,72,34,0.08)' } : {}}
                            >
                              {isSaving ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : wasSaved ? (
                                <CheckCircle size={14} />
                              ) : (
                                <Save size={14} />
                              )}
                              {wasSaved ? 'Saved!' : isSaving ? 'Saving…' : 'Save Changes'}
                            </button>
                          </div>

                          {/* Middle: Member profile info */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <User size={14} /> Member Profile
                            </h4>

                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-600 mb-0.5">Full Name</p>
                                <p className="text-gray-200">{m.full_name || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-0.5">Email</p>
                                <p className="text-gray-200">{m.email}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-0.5 flex items-center gap-1">
                                  <Calendar size={10} /> Date of Birth
                                </p>
                                <p className="text-gray-200">
                                  {m.date_of_birth
                                    ? new Date(m.date_of_birth).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })
                                    : <span className="text-gray-600">Not provided</span>}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-0.5 flex items-center gap-1">
                                  <MapPin size={10} /> Residential Address
                                </p>
                                <p className="text-gray-200 text-xs leading-relaxed">
                                  {m.residential_address || <span className="text-gray-600">Not provided</span>}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-0.5">Approved</p>
                                <p className="text-gray-200">
                                  {m.approved_at ? new Date(m.approved_at).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Right: Status & Phases */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                              Status & Progress
                            </h4>

                            {/* Onboarding status */}
                            <div
                              className={`rounded-xl p-3 flex items-center gap-3 ${
                                m.onboarding_completed
                                  ? 'bg-green-500/10 border border-green-500/20'
                                  : 'bg-yellow-500/10 border border-yellow-500/20'
                              }`}
                            >
                              {m.onboarding_completed ? (
                                <CheckCircle size={16} className="text-green-400 shrink-0" />
                              ) : (
                                <AlertCircle size={16} className="text-yellow-400 shrink-0" />
                              )}
                              <div>
                                <p className={`text-sm font-medium ${m.onboarding_completed ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {m.onboarding_completed ? 'Onboarding Complete' : 'Pending Onboarding'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {m.onboarding_completed
                                    ? 'Member has completed their profile setup'
                                    : 'Member has not yet completed onboarding'}
                                </p>
                              </div>
                            </div>

                            {/* Equity summary */}
                            {(edit.equity_percentage || edit.brand_name) && (
                              <div
                                className="rounded-xl p-3"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                              >
                                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Equity Summary</p>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  BrandPushers holds{' '}
                                  <strong style={{ color: '#F24822' }}>{edit.equity_percentage || '?'}%</strong> equity in{' '}
                                  <strong className="text-white">{edit.brand_name || 'their company'}</strong>.
                                </p>
                                {edit.equity_agreed && (
                                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                    <CheckCircle size={10} /> Terms confirmed
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Phase badges */}
                            {m.member_phases && m.member_phases.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2">Program Phases</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {m.member_phases.map((mp, i) => (
                                    <span
                                      key={i}
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        mp.status === 'completed'
                                          ? 'bg-green-500/15 text-green-400'
                                          : mp.status === 'in_progress'
                                          ? 'bg-blue-500/15 text-blue-400'
                                          : 'bg-gray-500/15 text-gray-400'
                                      }`}
                                    >
                                      {mp.phases?.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
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
  )
}

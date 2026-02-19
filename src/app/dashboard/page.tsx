'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, Circle, Loader, Building2, FileText, PieChart,
  User, X, Download, AlertTriangle, Pen, Lock
} from 'lucide-react'

interface MemberPhase {
  id: string
  status: string
  notes: string | null
  phases: { name: string; description: string; order: number }
}

interface Profile {
  full_name: string
  brand_name: string | null
  equity_percentage: number | null
  fee_amount: number | null
  equity_agreed: boolean
}

interface EquityStake {
  id: string
  stakeholder_name: string
  stakeholder_type: 'individual' | 'company'
  equity_percentage: number
}

interface EquityAgreement {
  id: string
  agreement_html: string
  status: 'pending' | 'signed' | 'expired' | 'revoked'
  sent_at: string
  signed_at: string | null
  signature_data: {
    signer_name: string
    timestamp: string
  } | null
}

const COLORS = [
  '#F24822', '#9B0EE5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
]

export default function DashboardPage() {
  const [phases, setPhases] = useState<MemberPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stakes, setStakes] = useState<EquityStake[]>([])
  const [agreements, setAgreements] = useState<EquityAgreement[]>([])

  // Sign flow
  const [signingAgreement, setSigningAgreement] = useState<EquityAgreement | null>(null)
  const [signerName, setSignerName] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')

  // View signed agreement
  const [viewingAgreement, setViewingAgreement] = useState<EquityAgreement | null>(null)

  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: p },
        { data: phases },
        { data: stakesData },
        { data: agreementsData },
      ] = await Promise.all([
        supabase.from('profiles').select('full_name, brand_name, equity_percentage, fee_amount, equity_agreed').eq('id', user.id).single(),
        supabase.from('member_phases').select('*, phases(name, description, order)').eq('member_id', user.id).order('phases(order)'),
        supabase.from('equity_stakes').select('id, stakeholder_name, stakeholder_type, equity_percentage').eq('brand_member_id', user.id).order('equity_percentage', { ascending: false }),
        supabase.from('equity_agreements').select('id, agreement_html, status, sent_at, signed_at, signature_data').eq('brand_member_id', user.id).order('created_at', { ascending: false }),
      ])

      setProfile(p)
      setPhases((phases || []) as MemberPhase[])
      setStakes((stakesData || []) as EquityStake[])
      setAgreements((agreementsData || []) as EquityAgreement[])
      setLoading(false)
    })()
  }, [supabase])

  const completed = phases.filter(p => p.status === 'completed').length
  const total = phases.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const totalEquity = stakes.reduce((s, e) => s + Number(e.equity_percentage), 0)

  const pendingAgreement = agreements.find(a => a.status === 'pending')
  const signedAgreements = agreements.filter(a => a.status === 'signed')

  const handleSign = async () => {
    if (!signingAgreement || !signerName || !consentChecked) return
    setSigning(true)
    setSignError('')
    try {
      const res = await fetch('/api/sign-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreement_id: signingAgreement.id,
          signer_name: signerName,
          consent: 'I agree to the equity participation agreement and all terms therein.',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSignError(data.error || 'Failed to sign')
        setSigning(false)
        return
      }
      // Refresh agreements
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: updated } = await supabase
          .from('equity_agreements')
          .select('id, agreement_html, status, sent_at, signed_at, signature_data')
          .eq('brand_member_id', user.id)
          .order('created_at', { ascending: false })
        setAgreements((updated || []) as EquityAgreement[])
      }
      setSigningAgreement(null)
      setSigning(false)
    } catch {
      setSignError('Network error. Please try again.')
      setSigning(false)
    }
  }

  const handleDownload = (agreement: EquityAgreement) => {
    const blob = new Blob([agreement.agreement_html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equity-agreement-${new Date(agreement.signed_at || agreement.sent_at).toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
      </h1>
      <p className="text-gray-400 mb-8">Track your brand-building progress below.</p>

      {/* ── EQUITY SECTION ── */}
      {(stakes.length > 0 || pendingAgreement || signedAgreements.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-brand-orange" />
            <h2 className="font-semibold text-lg">Equity Partnership</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Cap Table */}
            {stakes.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-brand-purple/20">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 size={15} className="text-brand-orange" />
                  <h3 className="font-semibold text-sm">
                    {profile?.brand_name || 'Your Brand'} — Cap Table
                  </h3>
                </div>

                {/* Stacked bar */}
                <div className="w-full h-5 bg-dark-700 rounded-full overflow-hidden flex mb-3">
                  {stakes.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        width: `${Math.min(s.equity_percentage, 100)}%`,
                        background: COLORS[i % COLORS.length],
                        transition: 'width 0.5s ease',
                        minWidth: s.equity_percentage > 0 ? '2px' : 0,
                      }}
                      title={`${s.stakeholder_name}: ${s.equity_percentage}%`}
                    />
                  ))}
                  {totalEquity < 100 && (
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                  )}
                </div>

                {/* Stakeholder list */}
                <div className="space-y-2">
                  {stakes.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {s.stakeholder_type === 'company'
                          ? <Building2 size={12} className="text-gray-400" />
                          : <User size={12} className="text-gray-400" />
                        }
                      </div>
                      <span className="text-sm flex-1">{s.stakeholder_name}</span>
                      <span className="text-sm font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                        {s.equity_percentage}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total allocated</span>
                  <span className="text-sm font-bold text-white">{totalEquity.toFixed(2)}%</span>
                </div>
              </div>
            )}

            {/* Agreement Status */}
            <div className="space-y-3">
              {/* Pending agreement — Sign CTA */}
              {pendingAgreement && (
                <div className="glass rounded-2xl p-5 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">Signature Required</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3">
                        Your equity agreement is ready for review and signature. Please read and sign to confirm the ownership structure.
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Sent: {new Date(pendingAgreement.sent_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingAgreement(pendingAgreement)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition"
                        >
                          <FileText size={12} /> Preview
                        </button>
                        <button
                          onClick={() => { setSigningAgreement(pendingAgreement); setSignerName(profile?.full_name || ''); setConsentChecked(false); setSignError('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-orange text-white rounded-lg hover:bg-brand-orange/80 transition font-medium"
                        >
                          <Pen size={12} /> Sign Agreement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Signed agreements */}
              {signedAgreements.map(a => (
                <div key={a.id} className="glass rounded-2xl p-5 border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle size={18} className="text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1 text-green-400">Equity Agreement Signed</h3>
                      <p className="text-xs text-gray-500 mb-1">
                        Signed: {new Date(a.signed_at!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {a.signature_data && (
                        <p className="text-xs text-gray-500 mb-3">By: {a.signature_data.signer_name}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingAgreement(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition"
                        >
                          <FileText size={12} /> View
                        </button>
                        <button
                          onClick={() => handleDownload(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition"
                        >
                          <Download size={12} /> Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* No agreement yet */}
              {!pendingAgreement && signedAgreements.length === 0 && stakes.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Lock size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">Agreement Pending</h3>
                      <p className="text-gray-500 text-xs">Your admin will send you an equity agreement to sign once the cap table is finalized.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Legacy equity card (if old-style data only) */}
      {stakes.length === 0 && profile?.equity_percentage != null && (
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
              {profile?.brand_name && (
                <p className="text-brand-orange font-medium mb-2">{profile.brand_name}</p>
              )}
              {profile?.equity_percentage != null && (
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-white">{profile.equity_percentage}%</span>
                  <span className="text-gray-400 text-sm">BrandPushers equity stake</span>
                </div>
              )}
              {profile?.equity_agreed && (
                <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                  <CheckCircle size={14} />
                  <span>Equity terms confirmed</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Overall Progress</h3>
          <span className="text-brand-orange font-bold">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-logo-gradient rounded-full"
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">{completed} of {total} phases completed</p>
      </div>

      {/* Phase list */}
      <div className="space-y-3">
        {phases.map((mp, i) => (
          <motion.div
            key={mp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 flex items-center gap-4"
          >
            <div className="shrink-0">
              {mp.status === 'completed' ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : mp.status === 'in_progress' ? (
                <Loader className="text-blue-400 animate-spin" size={24} />
              ) : (
                <Circle className="text-gray-600" size={24} />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{mp.phases.name}</h4>
              {mp.phases.description && (
                <p className="text-gray-500 text-sm">{mp.phases.description}</p>
              )}
              {mp.notes && (
                <p className="text-gray-400 text-sm mt-1 italic">{mp.notes}</p>
              )}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              mp.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : mp.status === 'in_progress'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {mp.status.replace('_', ' ')}
            </span>
          </motion.div>
        ))}

        {phases.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-gray-500">
            No phases assigned yet. Your admin will set up your program phases soon.
          </div>
        )}
      </div>

      {/* ── SIGN AGREEMENT MODAL ── */}
      <AnimatePresence>
        {signingAgreement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl my-8"
            >
              {/* Agreement content */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
                <div className="bg-dark-800 border-b border-white/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-brand-orange" />
                    <span className="font-semibold text-sm">Equity Agreement</span>
                  </div>
                  <button onClick={() => setSigningAgreement(null)} className="text-gray-500 hover:text-white transition">
                    <X size={18} />
                  </button>
                </div>
                <div
                  className="max-h-96 overflow-y-auto p-2"
                  dangerouslySetInnerHTML={{ __html: signingAgreement.agreement_html }}
                />
              </div>

              {/* Signature panel */}
              <div className="bg-dark-800 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Pen size={16} className="text-brand-orange" />
                  Sign this Agreement
                </h3>

                {/* Consent checkbox */}
                <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                  <div
                    onClick={() => setConsentChecked(p => !p)}
                    className={`w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      consentChecked ? 'bg-brand-orange border-brand-orange' : 'border-white/30 bg-transparent'
                    }`}
                  >
                    {consentChecked && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-300 leading-relaxed group-hover:text-white transition">
                    I have read and understood the equity participation agreement above. I agree to be legally bound by its terms,
                    and I acknowledge that my electronic signature is valid under the U.S. ESIGN Act and applicable state law.
                  </span>
                </label>

                {/* Full name */}
                <div className="mb-5">
                  <label className="block text-xs text-gray-500 mb-2">
                    Type your full legal name to sign *
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder="e.g. Jane Elizabeth Smith"
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange font-medium transition"
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    This constitutes your electronic signature.
                  </p>
                </div>

                {signError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle size={14} /> {signError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSigningAgreement(null)}
                    className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl text-sm hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSign}
                    disabled={signing || !signerName.trim() || !consentChecked}
                    className="flex-1 py-3 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-brand-orange/80 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {signing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Pen size={14} />
                    )}
                    {signing ? 'Signing…' : 'Sign Agreement'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEW AGREEMENT MODAL ── */}
      <AnimatePresence>
        {viewingAgreement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl"
            >
              <div className="bg-dark-800 border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-brand-orange" />
                  <span className="font-semibold text-sm">
                    Equity Agreement
                    {viewingAgreement.status === 'signed' && (
                      <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">Signed</span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  {viewingAgreement.status === 'signed' && (
                    <button
                      onClick={() => handleDownload(viewingAgreement)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition"
                    >
                      <Download size={12} /> Download
                    </button>
                  )}
                  {viewingAgreement.status === 'pending' && (
                    <button
                      onClick={() => { setSigningAgreement(viewingAgreement); setViewingAgreement(null); setSignerName(profile?.full_name || ''); setConsentChecked(false); setSignError('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-orange text-white rounded-lg hover:bg-brand-orange/80 transition"
                    >
                      <Pen size={12} /> Sign
                    </button>
                  )}
                  <button onClick={() => setViewingAgreement(null)} className="text-gray-500 hover:text-white transition">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: viewingAgreement.agreement_html }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

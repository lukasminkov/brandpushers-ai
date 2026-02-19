'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Trash2, Send, Eye, X, ChevronRight, Building2,
  User, Percent, CheckCircle, AlertCircle, FileText, Clock, RefreshCw
} from 'lucide-react'

interface Member {
  id: string
  email: string
  full_name: string
  brand_name: string | null
}

interface EquityStake {
  id: string
  brand_member_id: string
  stakeholder_name: string
  stakeholder_type: 'individual' | 'company'
  stakeholder_email: string | null
  stakeholder_address: string | null
  stakeholder_company_name: string | null
  equity_percentage: number
  created_at: string
}

interface EquityAgreement {
  id: string
  status: 'pending' | 'signed' | 'expired' | 'revoked'
  sent_at: string
  signed_at: string | null
}

interface AddForm {
  stakeholder_name: string
  stakeholder_type: 'individual' | 'company'
  stakeholder_email: string
  stakeholder_address: string
  stakeholder_company_name: string
  equity_percentage: string
}

const COLORS = [
  '#F24822', // brand orange — member's own
  '#9B0EE5', // brand purple — BrandPushers
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
]

const emptyForm: AddForm = {
  stakeholder_name: '',
  stakeholder_type: 'individual',
  stakeholder_email: '',
  stakeholder_address: '',
  stakeholder_company_name: '',
  equity_percentage: '',
}

function generateAgreementHtml(member: Member, stakes: EquityStake[]): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const totalPct = stakes.reduce((s, e) => s + Number(e.equity_percentage), 0)
  const brandName = member.brand_name || '[Brand Name]'

  const stakeholderRows = stakes.map(s => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px 16px; font-weight: 500;">${s.stakeholder_name}</td>
      <td style="padding: 10px 16px; color: #6b7280; text-transform: capitalize;">${s.stakeholder_type}</td>
      <td style="padding: 10px 16px; color: #6b7280;">${s.stakeholder_email || '—'}</td>
      <td style="padding: 10px 16px; text-align: right; font-weight: 700; color: #F24822;">${s.equity_percentage}%</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; color: #111; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; }
    h1 { font-size: 28px; font-weight: bold; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 32px; margin-bottom: 8px; border-bottom: 2px solid #F24822; padding-bottom: 6px; color: #111; }
    p { margin: 12px 0; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f9fafb; padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    .total-row td { font-weight: 700; background: #fff7f5; color: #F24822; }
    .sig-block { margin-top: 48px; display: flex; gap: 48px; flex-wrap: wrap; }
    .sig-line { flex: 1; min-width: 200px; border-top: 1px solid #111; padding-top: 8px; margin-top: 40px; }
    .sig-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .header-bar { border-left: 4px solid #F24822; padding-left: 16px; margin-bottom: 32px; }
    .badge { display: inline-block; background: #fff7f5; border: 1px solid #F24822; color: #F24822; border-radius: 4px; padding: 2px 8px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="badge">EQUITY AGREEMENT</div>
    <h1>${brandName}</h1>
    <p style="color: #6b7280; margin: 0;">Equity Participation Agreement &amp; Cap Table</p>
  </div>

  <p><strong>Date:</strong> ${date}</p>
  <p><strong>Participant:</strong> ${member.full_name || member.email}</p>
  <p><strong>Brand / Company:</strong> ${brandName}</p>
  <p><strong>Administered by:</strong> WHUT.AI LLC (BrandPushers)</p>

  <h2>1. Purpose</h2>
  <p>
    This Equity Participation Agreement ("Agreement") sets forth the equity ownership structure for <strong>${brandName}</strong>
    as agreed between the Participant and BrandPushers (WHUT.AI LLC) in connection with the BrandPushers Accelerator Program.
    This Agreement supplements the BrandPushers Terms of Service and any individual program agreement executed between the parties.
  </p>

  <h2>2. Equity Cap Table</h2>
  <p>The following equity distribution has been agreed upon by all parties:</p>
  <table>
    <thead>
      <tr>
        <th>Stakeholder</th>
        <th>Type</th>
        <th>Email</th>
        <th style="text-align: right;">Equity %</th>
      </tr>
    </thead>
    <tbody>
      ${stakeholderRows}
      <tr class="total-row">
        <td style="padding: 10px 16px;" colspan="3">TOTAL</td>
        <td style="padding: 10px 16px; text-align: right;">${totalPct.toFixed(2)}%</td>
      </tr>
    </tbody>
  </table>

  <h2>3. Binding Nature</h2>
  <p>
    By executing this Agreement (including by virtual/electronic signature on the BrandPushers platform), the Participant:
  </p>
  <ul>
    <li>Acknowledges and agrees to the equity distribution set out above;</li>
    <li>Agrees to reflect this equity structure in the company's operating agreement, cap table, or shareholder register within 30 days;</li>
    <li>Understands that this Agreement is legally binding and enforceable to the same extent as a wet-ink signature under applicable electronic signature laws (including the U.S. ESIGN Act and UETA);</li>
    <li>Confirms they have read and agree to the BrandPushers Terms of Service, including the equity provisions in Section 4.</li>
  </ul>

  <h2>4. Terms &amp; Conditions</h2>
  <p>
    BrandPushers' equity stake is a passive membership interest or shareholding. It entitles BrandPushers to its proportional share of
    distributions and exit proceeds. BrandPushers does not assume operational control unless separately agreed.
    Any future amendment to this equity structure requires BrandPushers' prior written consent.
  </p>
  <p>
    This Agreement is governed by the laws of the State of Wyoming, United States. Disputes shall be resolved through binding arbitration
    as set forth in the BrandPushers Terms of Service.
  </p>

  <h2>5. Signatures</h2>
  <div class="sig-block">
    <div class="sig-line">
      <p>_________________________________</p>
      <p class="sig-label">Participant Signature</p>
      <p class="sig-label">${member.full_name || member.email}</p>
      <p class="sig-label">Date: ___________________</p>
    </div>
    <div class="sig-line">
      <p>_________________________________</p>
      <p class="sig-label">On behalf of WHUT.AI LLC (BrandPushers)</p>
      <p class="sig-label">Authorized Signatory</p>
      <p class="sig-label">Date: ${date}</p>
    </div>
  </div>

  <p style="margin-top: 48px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    This document was generated by the BrandPushers platform on ${date} and constitutes a legally binding agreement.
    Electronic signatures on this document are valid under the U.S. ESIGN Act (15 U.S.C. § 7001 et seq.) and applicable state law.
  </p>
</body>
</html>`
}

export default function EquityPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [stakes, setStakes] = useState<EquityStake[]>([])
  const [agreements, setAgreements] = useState<EquityAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [stakesLoading, setStakesLoading] = useState(false)

  // Add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<AddForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Agreement preview
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [sendingAgreement, setSendingAgreement] = useState(false)
  const [agreementSent, setAgreementSent] = useState(false)

  // Load all members
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, brand_name')
        .eq('role', 'member')
        .order('full_name')
      setMembers((data || []) as Member[])
      setLoading(false)
    })()
  }, [supabase])

  const loadMemberData = useCallback(async (memberId: string) => {
    setStakesLoading(true)
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from('equity_stakes').select('*').eq('brand_member_id', memberId).order('equity_percentage', { ascending: false }),
      supabase.from('equity_agreements').select('id, status, sent_at, signed_at').eq('brand_member_id', memberId).order('created_at', { ascending: false }),
    ])
    setStakes((s || []) as EquityStake[])
    setAgreements((a || []) as EquityAgreement[])
    setStakesLoading(false)
    setAgreementSent(false)
  }, [supabase])

  useEffect(() => {
    if (selectedMember) loadMemberData(selectedMember.id)
  }, [selectedMember, loadMemberData])

  const totalPct = stakes.reduce((s, e) => s + Number(e.equity_percentage), 0)
  const remaining = 100 - totalPct

  const handleAddStakeholder = async () => {
    if (!selectedMember || !form.stakeholder_name || !form.equity_percentage) return
    setSaving(true)
    const { error } = await supabase.from('equity_stakes').insert({
      brand_member_id: selectedMember.id,
      stakeholder_name: form.stakeholder_name,
      stakeholder_type: form.stakeholder_type,
      stakeholder_email: form.stakeholder_email || null,
      stakeholder_address: form.stakeholder_address || null,
      stakeholder_company_name: form.stakeholder_company_name || null,
      equity_percentage: parseFloat(form.equity_percentage),
    })
    setSaving(false)
    if (!error) {
      setForm(emptyForm)
      setShowAddForm(false)
      loadMemberData(selectedMember.id)
    }
  }

  const handleDeleteStake = async (id: string) => {
    if (!selectedMember) return
    await supabase.from('equity_stakes').delete().eq('id', id)
    loadMemberData(selectedMember.id)
  }

  const handlePreviewAgreement = () => {
    if (!selectedMember || stakes.length === 0) return
    const html = generateAgreementHtml(selectedMember, stakes)
    setPreviewHtml(html)
    setShowPreview(true)
  }

  const handleSendAgreement = async () => {
    if (!selectedMember || stakes.length === 0) return
    setSendingAgreement(true)
    const html = generateAgreementHtml(selectedMember, stakes)
    const snapshot = stakes.map(s => ({
      name: s.stakeholder_name,
      type: s.stakeholder_type,
      percentage: s.equity_percentage,
    }))
    const { error } = await supabase.from('equity_agreements').insert({
      brand_member_id: selectedMember.id,
      agreement_html: html,
      total_equity_snapshot: snapshot,
      status: 'pending',
      sent_at: new Date().toISOString(),
    })
    setSendingAgreement(false)
    if (!error) {
      setShowPreview(false)
      setAgreementSent(true)
      loadMemberData(selectedMember.id)
    }
  }

  const statusColor = (s: string) => {
    if (s === 'signed') return 'text-green-400 bg-green-500/20'
    if (s === 'pending') return 'text-yellow-400 bg-yellow-500/20'
    if (s === 'revoked') return 'text-red-400 bg-red-500/20'
    return 'text-gray-400 bg-gray-500/20'
  }

  const statusIcon = (s: string) => {
    if (s === 'signed') return <CheckCircle size={12} />
    if (s === 'pending') return <Clock size={12} />
    return <AlertCircle size={12} />
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Equity Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage cap tables and equity agreements for members</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Member List */}
        <div className="col-span-4">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Users size={13} /> Select Member
              </p>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {members.length === 0 && (
                <p className="p-6 text-center text-gray-500 text-sm">No approved members yet</p>
              )}
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={`w-full p-4 text-left flex items-center gap-3 hover:bg-white/5 transition-colors ${
                    selectedMember?.id === m.id ? 'bg-brand-orange/10 border-l-2 border-brand-orange' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-logo-gradient flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{m.full_name || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs truncate">{m.email}</p>
                    {m.brand_name && (
                      <p className="text-brand-orange text-xs mt-0.5">{m.brand_name}</p>
                    )}
                  </div>
                  <ChevronRight size={14} className={`shrink-0 transition-transform ${selectedMember?.id === m.id ? 'text-brand-orange rotate-90' : 'text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cap Table */}
        <div className="col-span-8">
          {!selectedMember ? (
            <div className="glass rounded-2xl p-12 text-center text-gray-500">
              <Building2 size={40} className="mx-auto mb-4 text-gray-700" />
              <p className="font-medium">Select a member to manage their equity</p>
            </div>
          ) : stakesLoading ? (
            <div className="glass rounded-2xl p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedMember.full_name || selectedMember.email}</h2>
                    {selectedMember.brand_name && (
                      <p className="text-brand-orange text-sm font-medium mt-0.5">{selectedMember.brand_name}</p>
                    )}
                    <p className="text-gray-500 text-sm">{selectedMember.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadMemberData(selectedMember.id)}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
                      title="Refresh"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => { setForm(emptyForm); setShowAddForm(true) }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange rounded-xl text-sm font-medium hover:bg-brand-orange/20 transition"
                    >
                      <Plus size={15} /> Add Stakeholder
                    </button>
                    <button
                      onClick={handlePreviewAgreement}
                      disabled={stakes.length === 0 || Math.abs(totalPct - 100) > 0.01}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-purple/10 border border-brand-purple/30 text-purple-400 rounded-xl text-sm font-medium hover:bg-brand-purple/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={stakes.length === 0 ? 'Add stakeholders first' : totalPct !== 100 ? 'Cap table must total 100%' : ''}
                    >
                      <Send size={15} /> Send Agreement
                    </button>
                  </div>
                </div>
              </div>

              {/* Equity Total Bar */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Cap Table Total</span>
                  <span className={`text-sm font-bold ${Math.abs(totalPct - 100) < 0.01 ? 'text-green-400' : totalPct > 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {totalPct.toFixed(2)}% / 100%
                    {Math.abs(totalPct - 100) < 0.01 && ' ✓'}
                    {totalPct > 100 && ' ⚠ Over!'}
                  </span>
                </div>

                {/* Stacked bar */}
                <div className="w-full h-8 bg-dark-700 rounded-full overflow-hidden flex">
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
                  {remaining > 0.01 && (
                    <div
                      style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
                      title={`Unallocated: ${remaining.toFixed(2)}%`}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {stakes.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-gray-400">{s.stakeholder_name}</span>
                      <span className="text-xs font-medium" style={{ color: COLORS[i % COLORS.length] }}>{s.equity_percentage}%</span>
                    </div>
                  ))}
                  {remaining > 0.01 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10 shrink-0" />
                      <span className="text-xs text-gray-500">Unallocated {remaining.toFixed(2)}%</span>
                    </div>
                  )}
                </div>

                {agreementSent && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={14} /> Agreement sent for signature!
                  </div>
                )}
              </div>

              {/* Cap Table */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Stakeholders</h3>
                </div>
                {stakes.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    <Percent size={32} className="mx-auto mb-3 text-gray-700" />
                    No stakeholders yet. Add one to build the cap table.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {stakes.map((s, i) => (
                      <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-white/3 transition-colors group">
                        <div className="w-3 h-8 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          {s.stakeholder_type === 'company' ? <Building2 size={16} className="text-gray-400" /> : <User size={16} className="text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{s.stakeholder_name}</p>
                          {s.stakeholder_company_name && (
                            <p className="text-xs text-gray-500">Company: {s.stakeholder_company_name}</p>
                          )}
                          {s.stakeholder_email && (
                            <p className="text-xs text-gray-500">{s.stakeholder_email}</p>
                          )}
                          {s.stakeholder_address && (
                            <p className="text-xs text-gray-600 truncate">{s.stakeholder_address}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                            {s.equity_percentage}%
                          </p>
                          <p className="text-xs text-gray-600 capitalize">{s.stakeholder_type}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteStake(s.id)}
                          className="p-1.5 text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    {/* Total row */}
                    <div className="p-4 flex items-center justify-between bg-white/3">
                      <span className="font-semibold text-sm text-gray-300">Total</span>
                      <span className={`text-xl font-bold ${Math.abs(totalPct - 100) < 0.01 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {totalPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Agreement History */}
              {agreements.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-white/10">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <FileText size={13} /> Agreement History
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {agreements.map(a => (
                      <div key={a.id} className="p-4 flex items-center justify-between">
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${statusColor(a.status)}`}>
                            {statusIcon(a.status)} {a.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Sent: {new Date(a.sent_at).toLocaleDateString()}
                            {a.signed_at && ` • Signed: ${new Date(a.signed_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Stakeholder Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowAddForm(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Add Stakeholder</h2>
                <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Type selector */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Stakeholder Type</label>
                  <div className="flex gap-2">
                    {(['individual', 'company'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setForm(p => ({ ...p, stakeholder_type: t }))}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition border ${
                          form.stakeholder_type === t
                            ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                            : 'bg-dark-700 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {t === 'individual' ? <><User size={12} className="inline mr-1" />Individual</> : <><Building2 size={12} className="inline mr-1" />Company</>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {form.stakeholder_type === 'company' ? 'Contact / Representative Name' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    value={form.stakeholder_name}
                    onChange={e => setForm(p => ({ ...p, stakeholder_name: e.target.value }))}
                    placeholder={form.stakeholder_type === 'company' ? 'e.g. John Smith (CEO)' : 'e.g. Jane Doe'}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Company name (if company) */}
                {form.stakeholder_type === 'company' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Company / Legal Entity Name *</label>
                    <input
                      type="text"
                      value={form.stakeholder_company_name}
                      onChange={e => setForm(p => ({ ...p, stakeholder_company_name: e.target.value }))}
                      placeholder="e.g. BrandPushers LLC / WHUT.AI LLC"
                      className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.stakeholder_email}
                    onChange={e => setForm(p => ({ ...p, stakeholder_email: e.target.value }))}
                    placeholder="stakeholder@example.com"
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {form.stakeholder_type === 'company' ? 'Registered Address' : 'Residential Address'}
                  </label>
                  <input
                    type="text"
                    value={form.stakeholder_address}
                    onChange={e => setForm(p => ({ ...p, stakeholder_address: e.target.value }))}
                    placeholder="Street, City, State, Country"
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Equity % */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Equity Percentage *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.5"
                      value={form.equity_percentage}
                      onChange={e => setForm(p => ({ ...p, equity_percentage: e.target.value }))}
                      placeholder={`Max available: ${remaining.toFixed(2)}%`}
                      className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
                    />
                    <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                  {remaining > 0 && (
                    <p className="text-xs text-gray-600 mt-1">Remaining available: {remaining.toFixed(2)}%</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleAddStakeholder}
                  disabled={saving || !form.stakeholder_name || !form.equity_percentage}
                  className="flex-1 py-2 rounded-xl bg-brand-orange text-white font-medium text-sm hover:bg-brand-orange/80 transition disabled:opacity-50"
                >
                  {saving ? 'Adding…' : 'Add Stakeholder'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agreement Preview Modal */}
      <AnimatePresence>
        {showPreview && (
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
              {/* Preview header (dark) */}
              <div className="bg-dark-800 border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-brand-orange" />
                  <span className="font-semibold text-sm">Agreement Preview</span>
                  <span className="text-xs text-gray-500">— Review before sending</span>
                </div>
                <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-white transition">
                  <X size={18} />
                </button>
              </div>

              {/* Preview iframe */}
              <div
                className="w-full"
                style={{ minHeight: '600px' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />

              {/* Footer actions */}
              <div className="bg-dark-800 border-t border-white/10 p-4 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500 flex-1">
                  This agreement will be sent to the member for electronic signature. The member will see this document and sign it on their dashboard.
                </p>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setShowPreview(false)} className="px-4 py-2 border border-white/10 text-gray-400 rounded-xl text-sm hover:text-white transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendAgreement}
                    disabled={sendingAgreement}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/80 transition disabled:opacity-50"
                  >
                    {sendingAgreement ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {sendingAgreement ? 'Sending…' : 'Send for Signature'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Trash2, Send, Eye, X, ChevronRight, Building2,
  User, Percent, CheckCircle, AlertCircle, FileText, Clock, RefreshCw
} from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────── */
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

/* ─── Constants ──────────────────────────────────────────── */
const COLORS = ['#F24822','#9B0EE5','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4']
const EMPTY_FORM: AddForm = {
  stakeholder_name: '', stakeholder_type: 'individual',
  stakeholder_email: '', stakeholder_address: '',
  stakeholder_company_name: '', equity_percentage: '',
}

/* ─── Modal shell ─────────────────────────────────────────
   Whop-style: dark overlay, scale+y entrance, header / body / footer
   ────────────────────────────────────────────────────────── */
function Modal({
  open, onClose, title, icon, width = 'max-w-lg', children,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  icon?: React.ReactNode
  width?: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{   opacity: 0, scale: 0.97, y: 8  }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${width} my-8 rounded-2xl overflow-hidden shadow-2xl`}
            style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Orange accent line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-[#F24822] via-[#9B0EE5] to-[#F57B18]" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ModalHeader({ title, icon, onClose }: { title: React.ReactNode; icon?: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.07]">
      {icon && <span className="text-brand-orange">{icon}</span>}
      <span className="font-semibold text-[15px] text-white flex-1">{title}</span>
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  )
}
function ModalBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>
}
function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-2">
      {children}
    </div>
  )
}
function BtnCancel({ onClick, label = 'Cancel' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 hover:bg-white/5 transition-all"
    >
      {label}
    </button>
  )
}
function BtnPrimary({
  onClick, disabled, loading, children, danger,
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean
  children: React.ReactNode; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed
        ${danger
          ? 'bg-red-600 hover:bg-red-500'
          : 'bg-gradient-to-r from-[#F24822] to-[#F57B18] hover:opacity-90 shadow-lg shadow-[#F24822]/20'
        }`}
    >
      {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  )
}

/* ─── Agreement generator ─────────────────────────────── */
function generateAgreementHtml(member: Member, stakes: EquityStake[]): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const totalPct = stakes.reduce((s, e) => s + Number(e.equity_percentage), 0)
  const brandName = member.brand_name || '[Brand Name]'
  const rows = stakes.map(s => `
    <tr>
      <td style="padding:10px 16px;font-weight:500">${s.stakeholder_name}</td>
      <td style="padding:10px 16px;color:#6b7280;text-transform:capitalize">${s.stakeholder_type}</td>
      <td style="padding:10px 16px;color:#6b7280">${s.stakeholder_email || '—'}</td>
      <td style="padding:10px 16px;text-align:right;font-weight:700;color:#F24822">${s.equity_percentage}%</td>
    </tr>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body{font-family:Georgia,serif;color:#111;max-width:800px;margin:0 auto;padding:40px 20px;line-height:1.7}
    h1{font-size:28px;font-weight:bold;margin-bottom:4px}
    h2{font-size:18px;margin-top:32px;margin-bottom:8px;border-bottom:2px solid #F24822;padding-bottom:6px}
    p{margin:12px 0;color:#374151}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f9fafb;padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
    tr{border-bottom:1px solid #e5e7eb}
    .total td{font-weight:700;background:#fff7f5;color:#F24822}
    .sig-block{margin-top:48px;display:flex;gap:48px;flex-wrap:wrap}
    .sig-line{flex:1;min-width:200px;border-top:1px solid #111;padding-top:8px;margin-top:40px}
    .sig-label{font-size:12px;color:#6b7280;margin-top:4px}
    .badge{display:inline-block;background:#fff7f5;border:1px solid #F24822;color:#F24822;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600;margin-bottom:8px}
    .header-bar{border-left:4px solid #F24822;padding-left:16px;margin-bottom:32px}
  </style></head><body>
  <div class="header-bar">
    <div class="badge">EQUITY AGREEMENT</div>
    <h1>${brandName}</h1>
    <p style="color:#6b7280;margin:0">Equity Participation Agreement &amp; Cap Table</p>
  </div>
  <p><strong>Date:</strong> ${date}</p>
  <p><strong>Participant:</strong> ${member.full_name || member.email}</p>
  <p><strong>Brand / Company:</strong> ${brandName}</p>
  <p><strong>Administered by:</strong> WHUT.AI LLC (BrandPushers)</p>
  <h2>1. Purpose</h2>
  <p>This Equity Participation Agreement sets forth the equity ownership structure for <strong>${brandName}</strong> as agreed between the Participant and BrandPushers (WHUT.AI LLC) in connection with the BrandPushers Accelerator Program.</p>
  <h2>2. Equity Cap Table</h2>
  <table><thead><tr><th>Stakeholder</th><th>Type</th><th>Email</th><th style="text-align:right">Equity %</th></tr></thead>
  <tbody>${rows}<tr class="total"><td colspan="3" style="padding:10px 16px">TOTAL</td><td style="padding:10px 16px;text-align:right">${totalPct.toFixed(2)}%</td></tr></tbody></table>
  <h2>3. Binding Nature</h2>
  <p>By executing this Agreement via electronic signature on the BrandPushers platform, the Participant acknowledges and agrees to the equity distribution above, and confirms they have read and agree to the BrandPushers Terms of Service including Section 4 (equity) and Section 11A (electronic signatures).</p>
  <p>This electronic signature is legally valid under the U.S. ESIGN Act (15 U.S.C. § 7001) and UETA.</p>
  <h2>4. Governing Law</h2>
  <p>This Agreement is governed by the laws of the State of Wyoming, United States. Disputes shall be resolved through binding arbitration per the BrandPushers Terms of Service.</p>
  <h2>5. Signatures</h2>
  <div class="sig-block">
    <div class="sig-line"><p>_________________________________</p><p class="sig-label">Participant — ${member.full_name || member.email}</p><p class="sig-label">Date: ___________________</p></div>
    <div class="sig-line"><p>_________________________________</p><p class="sig-label">WHUT.AI LLC (BrandPushers) — Authorized Signatory</p><p class="sig-label">Date: ${date}</p></div>
  </div>
  <p style="margin-top:48px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px">Generated by BrandPushers platform on ${date}. Electronic signatures valid under U.S. ESIGN Act.</p>
  </body></html>`
}

/* ─── Field helpers ──────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}
const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F24822]/60 focus:bg-white/[0.06] transition-all'

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function EquityPage() {
  const supabase = createClient()
  const [members,        setMembers]        = useState<Member[]>([])
  const [selected,       setSelected]       = useState<Member | null>(null)
  const [stakes,         setStakes]         = useState<EquityStake[]>([])
  const [agreements,     setAgreements]     = useState<EquityAgreement[]>([])
  const [loading,        setLoading]        = useState(true)
  const [stakesLoading,  setStakesLoading]  = useState(false)
  const [agreementSent,  setAgreementSent]  = useState(false)

  // Add-stakeholder modal
  const [addOpen,  setAddOpen]  = useState(false)
  const [form,     setForm]     = useState<AddForm>(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)

  // Send-agreement modal
  const [previewOpen,       setPreviewOpen]       = useState(false)
  const [previewHtml,       setPreviewHtml]       = useState('')
  const [sendingAgreement,  setSendingAgreement]  = useState(false)

  /* Load members */
  useEffect(() => {
    supabase.from('profiles').select('id,email,full_name,brand_name').eq('role','member').order('full_name')
      .then(({ data }) => { setMembers((data || []) as Member[]); setLoading(false) })
  }, [supabase])

  /* Load stakes + agreements for selected member */
  const loadMemberData = useCallback(async (memberId: string) => {
    setStakesLoading(true)
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from('equity_stakes').select('*').eq('brand_member_id', memberId).order('equity_percentage', { ascending: false }),
      supabase.from('equity_agreements').select('id,status,sent_at,signed_at').eq('brand_member_id', memberId).order('created_at', { ascending: false }),
    ])
    setStakes((s || []) as EquityStake[])
    setAgreements((a || []) as EquityAgreement[])
    setStakesLoading(false)
    setAgreementSent(false)
  }, [supabase])

  useEffect(() => { if (selected) loadMemberData(selected.id) }, [selected, loadMemberData])

  const totalPct   = stakes.reduce((s, e) => s + Number(e.equity_percentage), 0)
  const remaining  = 100 - totalPct
  const capValid   = Math.abs(totalPct - 100) < 0.01

  /* Add stakeholder */
  const handleAdd = async () => {
    if (!selected || !form.stakeholder_name || !form.equity_percentage) return
    setSaving(true)
    const { error } = await supabase.from('equity_stakes').insert({
      brand_member_id:        selected.id,
      stakeholder_name:       form.stakeholder_name,
      stakeholder_type:       form.stakeholder_type,
      stakeholder_email:      form.stakeholder_email      || null,
      stakeholder_address:    form.stakeholder_address    || null,
      stakeholder_company_name: form.stakeholder_company_name || null,
      equity_percentage:      parseFloat(form.equity_percentage),
    })
    setSaving(false)
    if (!error) { setForm(EMPTY_FORM); setAddOpen(false); loadMemberData(selected.id) }
  }

  /* Delete stake */
  const handleDelete = async (id: string) => {
    if (!selected) return
    await supabase.from('equity_stakes').delete().eq('id', id)
    loadMemberData(selected.id)
  }

  /* Open preview */
  const openPreview = () => {
    if (!selected) return
    setPreviewHtml(generateAgreementHtml(selected, stakes))
    setPreviewOpen(true)
  }

  /* Send agreement */
  const sendAgreement = async () => {
    if (!selected) return
    setSendingAgreement(true)
    const snapshot = stakes.map(s => ({ name: s.stakeholder_name, type: s.stakeholder_type, percentage: s.equity_percentage }))
    const { error } = await supabase.from('equity_agreements').insert({
      brand_member_id:        selected.id,
      agreement_html:         previewHtml,
      total_equity_snapshot:  snapshot,
      status:                 'pending',
      sent_at:                new Date().toISOString(),
    })
    setSendingAgreement(false)
    if (!error) { setPreviewOpen(false); setAgreementSent(true); loadMemberData(selected.id) }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      signed:  'text-green-400 bg-green-500/15',
      pending: 'text-yellow-400 bg-yellow-500/15',
      revoked: 'text-red-400 bg-red-500/15',
      expired: 'text-gray-400 bg-gray-500/15',
    }
    const icon: Record<string, React.ReactNode> = {
      signed: <CheckCircle size={11}/>, pending: <Clock size={11}/>, revoked: <AlertCircle size={11}/>, expired: <AlertCircle size={11}/>,
    }
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s] || ''}`}>
        {icon[s]} {s}
      </span>
    )
  }

  /* ── Render ──────────────────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Equity Management</h1>
        <p className="text-gray-500 text-sm mt-1">Build cap tables and send equity agreements to members</p>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* ── Member list ─────────────────────────────────── */}
        <div className="col-span-4">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.07]">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Users size={12}/> Members
              </p>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
              {members.length === 0 && (
                <p className="p-6 text-center text-gray-500 text-sm">No approved members yet</p>
              )}
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`w-full p-4 text-left flex items-center gap-3 hover:bg-white/[0.04] transition-colors ${
                    selected?.id === m.id ? 'bg-[#F24822]/8 border-l-2 border-[#F24822]' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-logo-gradient flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{m.full_name || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs truncate">{m.email}</p>
                    {m.brand_name && <p className="text-brand-orange text-[11px] mt-0.5">{m.brand_name}</p>}
                  </div>
                  <ChevronRight size={13} className={`shrink-0 transition-transform text-gray-600 ${selected?.id === m.id ? 'text-brand-orange translate-x-0.5' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Cap table panel ──────────────────────────────── */}
        <div className="col-span-8">
          {!selected ? (
            <div className="glass rounded-2xl p-12 text-center text-gray-600">
              <Building2 size={40} className="mx-auto mb-3 opacity-30"/>
              <p className="font-medium text-gray-400">Select a member to manage their equity</p>
            </div>
          ) : stakesLoading ? (
            <div className="glass rounded-2xl p-12 flex justify-center">
              <div className="w-7 h-7 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Member banner + actions */}
              <div className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.full_name || selected.email}</h2>
                  {selected.brand_name && <p className="text-brand-orange text-sm font-medium mt-0.5">{selected.brand_name}</p>}
                  <p className="text-gray-500 text-sm">{selected.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => loadMemberData(selected.id)}
                    className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.08] transition"
                    title="Refresh"
                  >
                    <RefreshCw size={15}/>
                  </button>
                  <button
                    onClick={() => { setForm(EMPTY_FORM); setAddOpen(true) }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.08] transition"
                  >
                    <Plus size={14}/> Add Stakeholder
                  </button>
                  <button
                    onClick={openPreview}
                    disabled={stakes.length === 0 || !capValid}
                    title={stakes.length === 0 ? 'Add stakeholders first' : !capValid ? `Cap table must total 100% (currently ${totalPct.toFixed(2)}%)` : 'Preview & send agreement'}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#F24822] to-[#F57B18] text-white shadow-lg shadow-[#F24822]/20 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Send size={14}/> Send Agreement
                  </button>
                </div>
              </div>

              {/* Totals bar */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400">Cap Table Total</span>
                  <span className={`text-sm font-bold tabular-nums ${capValid ? 'text-green-400' : totalPct > 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {totalPct.toFixed(2)}% / 100%{capValid ? '  ✓' : totalPct > 100 ? '  ⚠ Over-allocated' : '  — incomplete'}
                  </span>
                </div>

                {/* Stacked colour bar */}
                <div className="w-full h-7 rounded-full overflow-hidden flex bg-white/[0.04]">
                  {stakes.map((s, i) => (
                    <div
                      key={s.id}
                      style={{ width: `${Math.min(s.equity_percentage, 100)}%`, background: COLORS[i % COLORS.length], transition: 'width .5s ease', minWidth: s.equity_percentage > 0 ? 2 : 0 }}
                      title={`${s.stakeholder_name}: ${s.equity_percentage}%`}
                    />
                  ))}
                  {remaining > 0.01 && <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)' }} title={`Unallocated: ${remaining.toFixed(2)}%`}/>}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {stakes.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}/>
                      <span className="text-[11px] text-gray-400">{s.stakeholder_name}</span>
                      <span className="text-[11px] font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{s.equity_percentage}%</span>
                    </div>
                  ))}
                  {remaining > 0.01 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white/10"/>
                      <span className="text-[11px] text-gray-600">Unallocated {remaining.toFixed(2)}%</span>
                    </div>
                  )}
                </div>

                {agreementSent && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={14}/> Agreement sent — the member will see it on their dashboard.
                  </div>
                )}
              </div>

              {/* Stakeholders table */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.07]">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Stakeholders</h3>
                </div>
                {stakes.length === 0 ? (
                  <div className="p-10 text-center text-gray-600 text-sm">
                    <Percent size={28} className="mx-auto mb-3 opacity-30"/>
                    No stakeholders yet. Click "Add Stakeholder" to build the cap table.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {stakes.map((s, i) => (
                      <div key={s.id} className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] group transition-colors">
                        <div className="w-1 h-10 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }}/>
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                          {s.stakeholder_type === 'company' ? <Building2 size={14} className="text-gray-400"/> : <User size={14} className="text-gray-400"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{s.stakeholder_name}</p>
                          {s.stakeholder_company_name && <p className="text-xs text-gray-500">Company: {s.stakeholder_company_name}</p>}
                          {s.stakeholder_email && <p className="text-xs text-gray-500">{s.stakeholder_email}</p>}
                          {s.stakeholder_address && <p className="text-xs text-gray-600 truncate max-w-xs">{s.stakeholder_address}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold tabular-nums" style={{ color: COLORS[i % COLORS.length] }}>{s.equity_percentage}%</p>
                          <p className="text-[11px] text-gray-600 capitalize">{s.stakeholder_type}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                    <div className="px-5 py-3 flex justify-between items-center bg-white/[0.02]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                      <span className={`text-base font-bold tabular-nums ${capValid ? 'text-green-400' : 'text-yellow-400'}`}>
                        {totalPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Agreement history */}
              {agreements.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/[0.07]">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <FileText size={12}/> Agreement History
                    </h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {agreements.map(a => (
                      <div key={a.id} className="px-5 py-3.5 flex items-center justify-between">
                        <div className="space-y-1">
                          {statusBadge(a.status)}
                          <p className="text-xs text-gray-600">
                            Sent {new Date(a.sent_at).toLocaleDateString()}
                            {a.signed_at && <span className="text-green-500 ml-2">• Signed {new Date(a.signed_at).toLocaleDateString()}</span>}
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

      {/* ═══════════════════════════════════════════════════
          MODAL: Add Stakeholder
          ═══════════════════════════════════════════════════ */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Stakeholder"
        icon={<Plus size={16}/>}
      >
        <ModalHeader title="Add Stakeholder" icon={<Plus size={16}/>} onClose={() => setAddOpen(false)}/>

        <ModalBody>
          <div className="space-y-4">

            {/* Type toggle */}
            <Field label="Stakeholder type">
              <div className="flex gap-2">
                {(['individual', 'company'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(p => ({ ...p, stakeholder_type: t }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      form.stakeholder_type === t
                        ? 'bg-[#F24822]/15 border-[#F24822]/50 text-[#F24822]'
                        : 'border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    {t === 'individual' ? <><User size={12} className="inline mr-1.5"/>Individual</> : <><Building2 size={12} className="inline mr-1.5"/>Company</>}
                  </button>
                ))}
              </div>
            </Field>

            {/* Name */}
            <Field label={form.stakeholder_type === 'company' ? 'Contact / Representative Name *' : 'Full Legal Name *'}>
              <input
                type="text"
                value={form.stakeholder_name}
                onChange={e => setForm(p => ({ ...p, stakeholder_name: e.target.value }))}
                placeholder={form.stakeholder_type === 'company' ? 'e.g. John Smith (CEO)' : 'e.g. Jane Doe'}
                className={inputCls}
              />
            </Field>

            {/* Company name */}
            {form.stakeholder_type === 'company' && (
              <Field label="Legal Entity / Company Name *">
                <input
                  type="text"
                  value={form.stakeholder_company_name}
                  onChange={e => setForm(p => ({ ...p, stakeholder_company_name: e.target.value }))}
                  placeholder="e.g. WHUT.AI LLC"
                  className={inputCls}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Email */}
              <Field label="Email">
                <input
                  type="email"
                  value={form.stakeholder_email}
                  onChange={e => setForm(p => ({ ...p, stakeholder_email: e.target.value }))}
                  placeholder="name@example.com"
                  className={inputCls}
                />
              </Field>

              {/* Equity % */}
              <Field label="Equity %  *">
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.5"
                    value={form.equity_percentage}
                    onChange={e => setForm(p => ({ ...p, equity_percentage: e.target.value }))}
                    placeholder={remaining > 0 ? `Max ${remaining.toFixed(2)}` : '0'}
                    className={inputCls + ' pr-9'}
                  />
                  <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"/>
                </div>
                {remaining > 0.01 && (
                  <p className="text-[10px] text-gray-600 mt-1">Available: {remaining.toFixed(2)}%</p>
                )}
              </Field>
            </div>

            {/* Address */}
            <Field label={form.stakeholder_type === 'company' ? 'Registered Address' : 'Residential Address'}>
              <input
                type="text"
                value={form.stakeholder_address}
                onChange={e => setForm(p => ({ ...p, stakeholder_address: e.target.value }))}
                placeholder="Street, City, State, Country"
                className={inputCls}
              />
            </Field>
          </div>
        </ModalBody>

        <ModalFooter>
          <BtnCancel onClick={() => setAddOpen(false)}/>
          <BtnPrimary
            onClick={handleAdd}
            loading={saving}
            disabled={!form.stakeholder_name || !form.equity_percentage}
          >
            <Plus size={14}/> Add Stakeholder
          </BtnPrimary>
        </ModalFooter>
      </Modal>

      {/* ═══════════════════════════════════════════════════
          MODAL: Agreement Preview & Send
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            key="preview-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
            onMouseDown={e => { if (e.target === e.currentTarget) setPreviewOpen(false) }}
          >
            <motion.div
              key="preview-card"
              initial={{ opacity: 0, scale: 0.97, y: 14 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{   opacity: 0, scale: 0.97, y: 8  }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl my-8 rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* accent line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-[#F24822] via-[#9B0EE5] to-[#F57B18]"/>

              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.07]">
                <Eye size={15} className="text-brand-orange"/>
                <span className="font-semibold text-[15px] text-white flex-1">Agreement Preview</span>
                <span className="text-xs text-gray-500 mr-3">Review before sending to member</span>
                <button onClick={() => setPreviewOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={15}/>
                </button>
              </div>

              {/* Document preview (white bg — looks like a real doc) */}
              <div className="bg-white overflow-y-auto max-h-[60vh]">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }}/>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/[0.07] flex items-center gap-4">
                <p className="text-xs text-gray-500 flex-1 leading-relaxed">
                  Sending this will make the agreement visible on the member&apos;s dashboard for electronic signature.
                </p>
                <BtnCancel onClick={() => setPreviewOpen(false)}/>
                <BtnPrimary onClick={sendAgreement} loading={sendingAgreement}>
                  <Send size={14}/> Send for Signature
                </BtnPrimary>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

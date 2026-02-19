'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import EquityManager from '@/components/admin/EquityManager'
import {
  ArrowLeft, User, PieChart, FileText, Calendar, MapPin,
  CheckCircle, AlertCircle, Building2, Mail, Clock, BookOpen
} from 'lucide-react'
import AdminBibleView from '@/components/admin/AdminBibleView'

interface MemberProfile {
  id: string
  email: string
  full_name: string
  role: string
  brand_name: string | null
  company_name: string | null
  company_type: string | null
  ein: string | null
  company_address: string | null
  onboarding_completed: boolean
  date_of_birth: string | null
  residential_address: string | null
  created_at: string
}

interface Document {
  id: string
  name: string
  file_path: string
  created_at: string
  type: string | null
}

interface Agreement {
  id: string
  status: string
  sent_at: string
  signed_at: string | null
}

type Tab = 'overview' | 'equity' | 'documents' | 'bible'

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  const supabase = createClient()

  const [member, setMember] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [documents, setDocuments] = useState<Document[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, brand_name, company_name, company_type, ein, company_address, onboarding_completed, date_of_birth, residential_address, created_at')
        .eq('id', memberId)
        .single()
      setMember(data as MemberProfile | null)
      setLoading(false)
    })()
  }, [supabase, memberId])

  // Load documents + agreements when documents tab is active
  useEffect(() => {
    if (tab !== 'documents' || !memberId) return
    setDocsLoading(true)
    Promise.all([
      supabase.from('documents').select('id, name, file_path, created_at, type').eq('user_id', memberId).order('created_at', { ascending: false }),
      supabase.from('equity_agreements').select('id, status, sent_at, signed_at').eq('brand_member_id', memberId).order('created_at', { ascending: false }),
    ]).then(([{ data: docs }, { data: agrs }]) => {
      setDocuments((docs || []) as Document[])
      setAgreements((agrs || []) as Agreement[])
      setDocsLoading(false)
    })
  }, [tab, memberId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Member not found</p>
        <button onClick={() => router.push('/admin/members')} className="mt-4 text-sm text-[#F24822] hover:underline">← Back to Members</button>
      </div>
    )
  }

  const roleBadgeCls: Record<string, string> = {
    admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    member: 'bg-green-500/15 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <User size={14} /> },
    { key: 'equity', label: 'Equity', icon: <PieChart size={14} /> },
    { key: 'documents', label: 'Documents', icon: <FileText size={14} /> },
    { key: 'bible', label: 'Bible', icon: <BookOpen size={14} /> },
  ]

  return (
    <div>
      {/* Back + header */}
      <button
        onClick={() => router.push('/admin/members')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition mb-6"
      >
        <ArrowLeft size={16} /> Back to Members
      </button>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
          >
            {(member.full_name || member.email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{member.full_name || 'Unknown'}</h1>
              <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium border ${roleBadgeCls[member.role] || roleBadgeCls.pending}`}>
                {member.role}
              </span>
              {member.onboarding_completed ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                  <CheckCircle size={10} /> Onboarded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                  <AlertCircle size={10} /> Pending
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">{member.email}</p>
            {member.brand_name && <p className="text-sm mt-0.5" style={{ color: '#F24822' }}>{member.brand_name}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.07] pb-px">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#F24822] text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile info */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Profile Information
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Full Name</p>
                <p className="text-gray-200">{member.full_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5 flex items-center gap-1"><Mail size={10} /> Email</p>
                <p className="text-gray-200">{member.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5 flex items-center gap-1"><Calendar size={10} /> Date of Birth</p>
                <p className="text-gray-200">
                  {member.date_of_birth
                    ? new Date(member.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : <span className="text-gray-600">Not provided</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5 flex items-center gap-1"><MapPin size={10} /> Residential Address</p>
                <p className="text-gray-200 text-xs leading-relaxed">
                  {member.residential_address || <span className="text-gray-600">Not provided</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5 flex items-center gap-1"><Clock size={10} /> Joined</p>
                <p className="text-gray-200">
                  {member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Company info */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={14} /> Company Information
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Brand Name</p>
                <p style={{ color: member.brand_name ? '#F24822' : undefined }} className={member.brand_name ? 'font-medium' : 'text-gray-600'}>
                  {member.brand_name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Company Name</p>
                <p className="text-gray-200">{member.company_name || <span className="text-gray-600">—</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Company Type</p>
                <p className="text-gray-200">{member.company_type || <span className="text-gray-600">—</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">EIN</p>
                <p className="text-gray-200">{member.ein || <span className="text-gray-600">—</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Company Address</p>
                <p className="text-gray-200 text-xs leading-relaxed">{member.company_address || <span className="text-gray-600">—</span>}</p>
              </div>
            </div>

            {/* Onboarding status card */}
            <div className={`rounded-xl p-3 flex items-center gap-3 ${
              member.onboarding_completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              {member.onboarding_completed
                ? <CheckCircle size={16} className="text-green-400 shrink-0" />
                : <AlertCircle size={16} className="text-yellow-400 shrink-0" />}
              <div>
                <p className={`text-sm font-medium ${member.onboarding_completed ? 'text-green-400' : 'text-yellow-400'}`}>
                  {member.onboarding_completed ? 'Onboarding Complete' : 'Pending Onboarding'}
                </p>
                <p className="text-xs text-gray-500">
                  {member.onboarding_completed ? 'Profile setup complete' : 'Has not completed onboarding'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'equity' && (
        <EquityManager member={{ id: member.id, email: member.email, full_name: member.full_name, brand_name: member.brand_name }} />
      )}

      {tab === 'documents' && (
        <div className="space-y-6">
          {docsLoading ? (
            <div className="flex justify-center py-12">
              <div className="spinner-sm" />
            </div>
          ) : (
            <>
              {/* Documents */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.07]">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <FileText size={12}/> Uploaded Documents
                  </h3>
                </div>
                {documents.length === 0 ? (
                  <div className="p-10 text-center text-gray-600 text-sm">No documents uploaded</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {documents.map(d => (
                      <div key={d.id} className="px-5 py-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-gray-600">{new Date(d.created_at).toLocaleDateString()}{d.type && ` · ${d.type}`}</p>
                        </div>
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${d.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#F24822] hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Agreements */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.07]">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <PieChart size={12}/> Equity Agreements
                  </h3>
                </div>
                {agreements.length === 0 ? (
                  <div className="p-10 text-center text-gray-600 text-sm">No agreements yet</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {agreements.map(a => {
                      const statusCls: Record<string, string> = {
                        signed: 'text-green-400 bg-green-500/15',
                        pending: 'text-yellow-400 bg-yellow-500/15',
                        cancelled: 'text-red-400 bg-red-500/15',
                        revoked: 'text-red-400 bg-red-500/15',
                      }
                      return (
                        <div key={a.id} className="px-5 py-3.5 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${statusCls[a.status] || ''}`}>
                              {a.status === 'signed' ? <CheckCircle size={11}/> : <Clock size={11}/>} {a.status}
                            </span>
                            <p className="text-xs text-gray-600">
                              Sent {new Date(a.sent_at).toLocaleDateString()}
                              {a.signed_at && <span className="text-green-500 ml-2">• Signed {new Date(a.signed_at).toLocaleDateString()}</span>}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {tab === 'bible' && (
        <AdminBibleView memberId={member.id} memberName={member.full_name} />
      )}
    </div>
  )
}

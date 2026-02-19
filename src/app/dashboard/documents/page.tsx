'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, ExternalLink, FileCheck, Loader2 } from 'lucide-react'

interface Doc {
  id: string
  name: string
  file_url: string
  uploaded_at: string
  phase_id: string | null
}

interface SignedAgreement {
  id: string
  signed_at: string
  brand_name: string | null
  agreement_html: string
}

export default function DocumentsPage() {
  const supabase = createClient()
  const [docs, setDocs] = useState<Doc[]>([])
  const [signedAgreements, setSignedAgreements] = useState<SignedAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewingAgreement, setViewingAgreement] = useState<SignedAgreement | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [docsRes, agreementsRes] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false }),
      supabase.from('equity_agreements')
        .select('id, signed_at, agreement_html')
        .eq('brand_member_id', user.id)
        .eq('status', 'signed')
        .order('signed_at', { ascending: false }),
    ])

    // Get brand name from profile for the agreements label
    const { data: profile } = await supabase.from('profiles').select('brand_name').eq('id', user.id).single()

    setDocs((docsRes.data || []) as Doc[])
    setSignedAgreements(
      (agreementsRes.data || []).map(a => ({ ...a, brand_name: profile?.brand_name || null })) as SignedAgreement[]
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const path = `${user.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('documents').upload(path, file)
    if (error) { alert(error.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    await supabase.from('documents').insert({ user_id: user.id, name: file.name, file_url: publicUrl })
    setUploading(false)
    load()
  }

  const remove = async (doc: Doc) => {
    await supabase.from('documents').delete().eq('id', doc.id)
    load()
  }

  const downloadAgreement = (agreement: SignedAgreement) => {
    const blob = new Blob([agreement.agreement_html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equity-agreement-${new Date(agreement.signed_at).toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F24822', borderTopColor: 'transparent' }} />
    </div>
  )

  const hasAny = docs.length > 0 || signedAgreements.length > 0

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Documents</h1>
          <p className="text-gray-500 text-sm">Your files, agreements, and uploaded documents</p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Uploading…' : 'Upload'}
          <input type="file" className="hidden" onChange={upload} disabled={uploading} />
        </label>
      </motion.div>

      {!hasAny ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-600">
          <FileText size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium text-gray-500">No documents yet</p>
          <p className="text-xs mt-1">Upload files or check back after signing your equity agreement</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* ── Signed Equity Agreements ─────────────────── */}
          {signedAgreements.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck size={12} style={{ color: '#4ade80' }} /> Signed Agreements
              </h2>
              <div className="space-y-2">
                {signedAgreements.map(agr => (
                  <motion.div
                    key={agr.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl group transition"
                    style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)' }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                      <FileCheck size={15} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        Equity Agreement {agr.brand_name ? `— ${agr.brand_name}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Signed {new Date(agr.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setViewingAgreement(agr)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadAgreement(agr)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition"
                        title="Download"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Uploaded Documents ────────────────────────── */}
          {docs.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={12} style={{ color: '#F24822' }} /> Files
              </h2>
              <div className="space-y-2">
                {docs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl group transition"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(242,72,34,0.08)', border: '1px solid rgba(242,72,34,0.15)' }}
                    >
                      <FileText size={15} style={{ color: '#F24822' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-white hover:text-[#F24822] transition truncate block">
                        {doc.name}
                      </a>
                      <p className="text-xs text-gray-600">
                        {new Date(doc.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#F24822] hover:bg-[#F24822]/10 transition"
                        title="Open">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => remove(doc)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                        title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Agreement viewer modal */}
      <AnimatePresence>
        {viewingAgreement && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setViewingAgreement(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 className="font-semibold text-white text-sm">Equity Agreement</h2>
                  <p className="text-xs text-green-400">
                    Signed {new Date(viewingAgreement.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadAgreement(viewingAgreement)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
                  >
                    <ExternalLink size={12} /> Download
                  </button>
                  <button onClick={() => setViewingAgreement(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="bg-white">
                  <div dangerouslySetInnerHTML={{ __html: viewingAgreement.agreement_html }} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

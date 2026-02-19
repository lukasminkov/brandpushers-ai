'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Trash2, ExternalLink, FileCheck, Loader2,
  FolderPlus, Folder, ChevronRight, ArrowLeft, MoreVertical,
  FolderOpen, File, Download, PenLine, CheckCircle, AlertCircle, X, XCircle,
  FolderInput
} from 'lucide-react'

const FOLDER_COLORS = ['#9B0EE5', '#F24822', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6']

/* ─── Types ──────────────────────────────────── */
interface Doc {
  id: string
  name: string
  file_url: string
  uploaded_at: string
  folder: string | null
}

interface SignedAgreement {
  id: string
  signed_at: string | null
  sent_at: string
  status: string
  brand_name: string | null
  agreement_html: string
}

/* ─── Tab button ──────────────────────────────── */
function Tab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
        active ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
      style={active ? { background: 'rgba(242,72,34,0.12)', border: '1px solid rgba(242,72,34,0.2)' } : {}}
    >
      {label}
      {count > 0 && (
        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: active ? 'rgba(242,72,34,0.2)' : 'rgba(255,255,255,0.08)' }}>
          {count}
        </span>
      )}
    </button>
  )
}

/* ─── Context Menu ────────────────────────────── */
function ContextMenu({ items, onClose }: { items: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler) }
  }, [onClose])
  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl p-1">
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.onClick(); onClose() }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-white/5'}`}>
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════ */
export default function DocumentsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'files' | 'agreements'>('files')
  const [docs, setDocs] = useState<Doc[]>([])
  const [agreements, setAgreements] = useState<SignedAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [viewingAgreement, setViewingAgreement] = useState<SignedAgreement | null>(null)
  const [signingAgreement, setSigningAgreement] = useState<SignedAgreement | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signConsent, setSignConsent] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const [signSuccess, setSignSuccess] = useState(false)

  // Context menu & inline editing state
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null) // doc id or folder path
  const [renameValue, setRenameValue] = useState('')
  const [moveTarget, setMoveTarget] = useState<Doc | null>(null) // file being moved
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null) // doc id or folder path

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [docsRes, agreementsRes, profileRes] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false }),
      supabase.from('equity_agreements')
        .select('id, signed_at, sent_at, status, agreement_html')
        .eq('brand_member_id', user.id)
        .in('status', ['signed', 'pending', 'cancelled'])
        .order('sent_at', { ascending: false }),
      supabase.from('profiles').select('brand_name').eq('id', user.id).single(),
    ])

    setDocs((docsRes.data || []) as Doc[])
    setAgreements(
      (agreementsRes.data || []).map(a => ({ ...a, brand_name: profileRes.data?.brand_name || null })) as SignedAgreement[]
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  /* ── File operations ─────────────────────────── */
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
    await supabase.from('documents').insert({
      user_id: user.id,
      name: file.name,
      file_url: publicUrl,
      folder: currentFolder,
    })
    setUploading(false)
    load()
  }

  const remove = async (doc: Doc) => {
    await supabase.from('documents').delete().eq('id', doc.id)
    load()
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('documents').insert({
      user_id: user.id,
      name: '__folder__',
      file_url: '',
      folder: currentFolder ? `${currentFolder}/${newFolderName.trim()}` : newFolderName.trim(),
    })
    setNewFolderName('')
    setShowNewFolder(false)
    load()
  }

  /* ── Rename file ─────────────────────────────── */
  const renameFile = async (docId: string, newName: string) => {
    if (!newName.trim()) return
    await supabase.from('documents').update({ name: newName.trim() }).eq('id', docId)
    setRenamingId(null)
    load()
  }

  /* ── Rename folder ───────────────────────────── */
  const renameFolder = async (oldPath: string, newName: string) => {
    if (!newName.trim()) return
    const parts = oldPath.split('/')
    parts[parts.length - 1] = newName.trim()
    const newPath = parts.join('/')
    if (newPath === oldPath) { setRenamingId(null); return }

    // Update all docs whose folder starts with oldPath
    const { data: allDocs } = await supabase.from('documents').select('id, folder').filter('folder', 'not.is', null)
    if (allDocs) {
      const updates = allDocs.filter(d => d.folder === oldPath || d.folder?.startsWith(oldPath + '/'))
      for (const d of updates) {
        const updatedFolder = newPath + (d.folder!.slice(oldPath.length))
        await supabase.from('documents').update({ folder: updatedFolder }).eq('id', d.id)
      }
    }
    setRenamingId(null)
    // If we're inside the renamed folder, update currentFolder
    if (currentFolder === oldPath || currentFolder?.startsWith(oldPath + '/')) {
      setCurrentFolder(newPath + (currentFolder!.slice(oldPath.length)))
    }
    load()
  }

  /* ── Delete folder ───────────────────────────── */
  const deleteFolder = async (folderPath: string) => {
    // Check if folder has files (non-placeholder docs)
    const filesInside = docs.filter(d => d.name !== '__folder__' && (d.folder === folderPath || d.folder?.startsWith(folderPath + '/')))
    if (filesInside.length > 0) {
      alert('Cannot delete folder — it contains files. Move or delete them first.')
      setDeleteConfirm(null)
      return
    }
    // Delete __folder__ placeholder(s) for this path and any empty sub-folders
    const foldersToDelete = docs.filter(d => d.name === '__folder__' && (d.folder === folderPath || d.folder?.startsWith(folderPath + '/')))
    for (const d of foldersToDelete) {
      await supabase.from('documents').delete().eq('id', d.id)
    }
    setDeleteConfirm(null)
    load()
  }

  /* ── Move file ───────────────────────────────── */
  const moveFile = async (doc: Doc, targetFolder: string | null) => {
    await supabase.from('documents').update({ folder: targetFolder }).eq('id', doc.id)
    setMoveTarget(null)
    load()
  }

  /* ── Agreement helpers ───────────────────────── */
  const downloadAgreement = (agr: SignedAgreement) => {
    const blob = new Blob([agr.agreement_html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equity-agreement-${agr.signed_at ? new Date(agr.signed_at).toISOString().split('T')[0] : 'pending'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openSignModal = (agr: SignedAgreement) => {
    setSigningAgreement(agr)
    setSignerName('')
    setSignConsent(false)
    setSigning(false)
    setSignError('')
    setSignSuccess(false)
  }

  const handleSign = async () => {
    if (!signingAgreement || !signerName.trim() || !signConsent) return
    setSigning(true)
    setSignError('')
    try {
      const res = await fetch('/api/sign-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreement_id: signingAgreement.id,
          signer_name: signerName.trim(),
          consent: 'I agree to this equity agreement and understand this constitutes a legal electronic signature under the ESIGN Act.',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSignError(data.error || 'Failed to sign'); setSigning(false); return }
      setSignSuccess(true)
      load()
    } catch {
      setSignError('Network error — please try again')
      setSigning(false)
    }
  }

  const agreementLabel = (agr: SignedAgreement, idx: number, total: number) => {
    if (total === 1) return `Equity Agreement${agr.brand_name ? ` — ${agr.brand_name}` : ''}`
    // Oldest = original, newer ones = amendments
    const reversedIdx = total - 1 - idx // agreements are sorted newest first
    if (reversedIdx === 0) return `Equity Agreement${agr.brand_name ? ` — ${agr.brand_name}` : ''}`
    return `Equity Agreement — Amendment ${reversedIdx}${agr.brand_name ? ` (${agr.brand_name})` : ''}`
  }

  /* ── Derived data ────────────────────────────── */
  // Get unique folders at current level
  const folders = Array.from(new Set(
    docs
      .filter(d => d.name === '__folder__' && d.folder)
      .map(d => d.folder!)
      .filter(f => {
        if (!currentFolder) return !f.includes('/')
        return f.startsWith(currentFolder + '/') && !f.slice(currentFolder.length + 1).includes('/')
      })
  ))

  const filesInFolder = docs.filter(d => d.name !== '__folder__' && d.folder === currentFolder)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F24822', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Documents</h1>
        <p className="text-gray-500 text-sm">Your files, agreements, and uploads</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Tab active={tab === 'files'} label="Files" count={docs.filter(d => d.name !== '__folder__').length} onClick={() => setTab('files')} />
        <Tab active={tab === 'agreements'} label="Agreements" count={agreements.length} onClick={() => setTab('agreements')} />
      </div>

      {/* ═══════════════════════════════════════════
          TAB 1: Files (Drive-like)
          ═══════════════════════════════════════════ */}
      {tab === 'files' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4">
            {currentFolder && (
              <button
                onClick={() => {
                  const parts = currentFolder.split('/')
                  parts.pop()
                  setCurrentFolder(parts.length > 0 ? parts.join('/') : null)
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <div className="flex items-center gap-1.5 text-sm text-gray-600 flex-1">
              <Folder size={14} />
              <span>{currentFolder || 'My Files'}</span>
            </div>
            <button
              onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <FolderPlus size={14} /> New Folder
            </button>
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white cursor-pointer transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? 'Uploading…' : 'Upload'}
              <input type="file" className="hidden" onChange={upload} disabled={uploading} />
            </label>
          </div>

          {/* New folder input */}
          <AnimatePresence>
            {showNewFolder && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
                    placeholder="Folder name…"
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F24822]/40"
                  />
                  <button onClick={createFolder} className="px-4 py-2.5 rounded-xl text-xs font-medium text-white" style={{ background: '#F24822' }}>Create</button>
                  <button onClick={() => setShowNewFolder(false)} className="px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:text-white transition">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          {folders.length === 0 && filesInFolder.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <FolderOpen size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-500">{currentFolder ? 'This folder is empty' : 'No files yet'}</p>
              <p className="text-xs mt-1">Upload files or create folders to organize your documents</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Folders */}
              {folders.map((f, fi) => {
                const folderName = f.includes('/') ? f.split('/').pop()! : f
                const isRenaming = renamingId === `folder:${f}`
                const isDeleting = deleteConfirm === `folder:${f}`
                const color = FOLDER_COLORS[fi % FOLDER_COLORS.length]
                return (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative flex items-center p-3.5 rounded-xl hover:bg-white/[0.04] transition text-left group"
                  >
                    <button onClick={() => setCurrentFolder(f)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                        <Folder size={15} style={{ color }} />
                      </div>
                      {isRenaming ? (
                        <input
                          autoFocus
                          className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-[#F24822]/40"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') renameFolder(f, renameValue); if (e.key === 'Escape') setRenamingId(null) }}
                          onBlur={() => setRenamingId(null)}
                        />
                      ) : (
                        <span className="flex-1 text-sm font-medium text-white truncate">{folderName}</span>
                      )}
                    </button>
                    {isDeleting ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">Delete?</span>
                        <button onClick={() => deleteFolder(f)} className="px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs rounded-lg text-gray-500 hover:text-white transition">No</button>
                      </div>
                    ) : (
                      <>
                        <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === `folder:${f}` ? null : `folder:${f}`) }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
                            <MoreVertical size={14} />
                          </button>
                          {openMenu === `folder:${f}` && (
                            <ContextMenu onClose={() => setOpenMenu(null)} items={[
                              { icon: <PenLine size={13} />, label: 'Rename', onClick: () => { setRenamingId(`folder:${f}`); setRenameValue(folderName) } },
                              { icon: <Trash2 size={13} />, label: 'Delete', danger: true, onClick: () => setDeleteConfirm(`folder:${f}`) },
                            ]} />
                          )}
                        </div>
                        <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition shrink-0" />
                      </>
                    )}
                  </motion.div>
                )
              })}
              {/* Files */}
              {filesInFolder.map((doc, i) => {
                const isRenaming = renamingId === doc.id
                const isDeleting = deleteConfirm === doc.id
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative flex items-center gap-3 p-3.5 rounded-xl group hover:bg-white/[0.03] transition"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(242,72,34,0.08)', border: '1px solid rgba(242,72,34,0.15)' }}
                    >
                      <File size={15} style={{ color: '#F24822' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isRenaming ? (
                        <input
                          autoFocus
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-[#F24822]/40"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') renameFile(doc.id, renameValue); if (e.key === 'Escape') setRenamingId(null) }}
                          onBlur={() => setRenamingId(null)}
                        />
                      ) : (
                        <>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-white hover:text-[#F24822] transition truncate block">
                            {doc.name}
                          </a>
                          <p className="text-[11px] text-gray-600">
                            {new Date(doc.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </>
                      )}
                    </div>
                    {isDeleting ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">Delete?</span>
                        <button onClick={() => { remove(doc); setDeleteConfirm(null) }} className="px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs rounded-lg text-gray-500 hover:text-white transition">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#F24822] hover:bg-[#F24822]/10 transition" title="Open">
                          <ExternalLink size={13} />
                        </a>
                        <div className="relative">
                          <button onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
                            <MoreVertical size={14} />
                          </button>
                          {openMenu === doc.id && (
                            <ContextMenu onClose={() => setOpenMenu(null)} items={[
                              { icon: <PenLine size={13} />, label: 'Rename', onClick: () => { setRenamingId(doc.id); setRenameValue(doc.name) } },
                              { icon: <FolderInput size={13} />, label: 'Move to…', onClick: () => setMoveTarget(doc) },
                              { icon: <Trash2 size={13} />, label: 'Delete', danger: true, onClick: () => setDeleteConfirm(doc.id) },
                            ]} />
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 2: Agreements
          ═══════════════════════════════════════════ */}
      {tab === 'agreements' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {agreements.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <FileCheck size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-500">No agreements yet</p>
              <p className="text-xs mt-1">Equity agreements will appear here once sent by your advisor</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agreements.map((agr, idx) => {
                const isSigned = agr.status === 'signed'
                const isCancelled = agr.status === 'cancelled'
                const isPending = agr.status === 'pending'
                const statusColors = isSigned
                  ? { bg: 'rgba(74,222,128,0.04)', border: 'rgba(74,222,128,0.15)', iconBg: 'rgba(74,222,128,0.1)', iconBorder: 'rgba(74,222,128,0.2)' }
                  : isCancelled
                  ? { bg: 'rgba(107,114,128,0.04)', border: 'rgba(107,114,128,0.15)', iconBg: 'rgba(107,114,128,0.1)', iconBorder: 'rgba(107,114,128,0.2)' }
                  : { bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.15)', iconBg: 'rgba(245,158,11,0.1)', iconBorder: 'rgba(245,158,11,0.2)' }
                return (
                  <motion.div
                    key={agr.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl group transition ${isCancelled ? 'opacity-50' : ''}`}
                    style={{
                      background: statusColors.bg,
                      border: `1px solid ${statusColors.border}`,
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: statusColors.iconBg,
                        border: `1px solid ${statusColors.iconBorder}`,
                      }}
                    >
                      {isSigned ? <FileCheck size={16} className="text-green-400" /> : isCancelled ? <XCircle size={16} className="text-gray-400" /> : <FileText size={16} className="text-yellow-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isCancelled ? 'text-gray-500 line-through' : 'text-white'}`}>{agreementLabel(agr, idx, agreements.length)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isSigned ? 'text-green-400 bg-green-500/15' : isCancelled ? 'text-gray-400 bg-gray-500/15' : 'text-yellow-400 bg-yellow-500/15'}`}>
                          {isSigned ? '✓ Signed' : isCancelled ? '✕ Cancelled' : '⏳ Pending'}
                        </span>
                        <span className="text-[11px] text-gray-600">
                          {isSigned && agr.signed_at
                            ? `Signed ${new Date(agr.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
                            : `Sent ${new Date(agr.sent_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <button
                          onClick={() => openSignModal(agr)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-90"
                          style={{ background: '#F24822' }}
                        >
                          <PenLine size={12} /> Sign
                        </button>
                      )}
                      <button
                        onClick={() => setViewingAgreement(agr)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadAgreement(agr)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Move to modal ─────────────────────────── */}
      <AnimatePresence>
        {moveTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setMoveTarget(null) }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm font-semibold text-white">Move &quot;{moveTarget.name}&quot;</h3>
                <button onClick={() => setMoveTarget(null)} className="p-1 rounded-lg text-gray-500 hover:text-white transition"><X size={14} /></button>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto space-y-0.5">
                <button onClick={() => moveFile(moveTarget, null)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${moveTarget.folder === null ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <Folder size={14} /> My Files {moveTarget.folder === null && <span className="ml-auto text-[10px] text-gray-500">current</span>}
                </button>
                {Array.from(new Set(docs.filter(d => d.name === '__folder__' && d.folder).map(d => d.folder!))).sort().map(f => (
                  <button key={f} onClick={() => moveFile(moveTarget, f)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${moveTarget.folder === f ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    style={{ paddingLeft: `${(f.split('/').length - 1) * 16 + 12}px` }}>
                    <Folder size={14} /> {f.split('/').pop()} {moveTarget.folder === f && <span className="ml-auto text-[10px] text-gray-500">current</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Signing modal ──────────────────────────── */}
      <AnimatePresence>
        {signingAgreement && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,72,34,0.15)', border: '1px solid rgba(242,72,34,0.3)' }}>
                    <FileText size={15} style={{ color: '#F24822' }} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white text-sm">Sign Agreement</h2>
                    <p className="text-xs text-gray-500">Review and sign below</p>
                  </div>
                </div>
                <button onClick={() => setSigningAgreement(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {signSuccess ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Agreement Signed!</h3>
                    <p className="text-gray-400 text-sm mb-6">Your signature has been recorded successfully.</p>
                    <button
                      onClick={() => setSigningAgreement(null)}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
                    >
                      Close
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Agreement document */}
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <div className="bg-white overflow-y-auto" style={{ maxHeight: '40vh' }}>
                        <div dangerouslySetInnerHTML={{ __html: signingAgreement.agreement_html }} />
                      </div>
                    </div>

                    {/* Signing section */}
                    <div className="space-y-4 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                          Type your full legal name to sign
                        </label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={e => setSignerName(e.target.value)}
                          placeholder="Your full legal name"
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition"
                          style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(242,72,34,0.5)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5">
                          <input type="checkbox" checked={signConsent} onChange={e => setSignConsent(e.target.checked)} className="sr-only" />
                          <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${signConsent ? 'border-transparent' : 'border-white/20'}`} style={signConsent ? { background: '#F24822' } : {}}>
                            {signConsent && <CheckCircle size={12} className="text-white" />}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition">
                          I agree to this equity agreement and understand this constitutes a legal electronic signature under the U.S. ESIGN Act.
                        </span>
                      </label>

                      {signError && (
                        <p className="text-red-400 text-xs flex items-center gap-1.5">
                          <AlertCircle size={12} /> {signError}
                        </p>
                      )}

                      <button
                        onClick={handleSign}
                        disabled={!signerName.trim() || !signConsent || signing}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
                      >
                        {signing ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Signing…
                          </>
                        ) : (
                          <>
                            <PenLine size={14} />
                            Sign Agreement
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Agreement viewer modal ──────────────── */}
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
                  <h2 className="font-semibold text-white text-sm">
                    {agreementLabel(viewingAgreement, agreements.indexOf(viewingAgreement), agreements.length)}
                  </h2>
                  <p className={`text-xs ${viewingAgreement.status === 'signed' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {viewingAgreement.status === 'signed' && viewingAgreement.signed_at
                      ? `Signed ${new Date(viewingAgreement.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                      : 'Pending your signature'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadAgreement(viewingAgreement)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
                  >
                    <Download size={12} /> Download
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

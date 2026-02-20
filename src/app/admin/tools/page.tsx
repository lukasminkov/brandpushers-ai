'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminModal from '@/components/admin/AdminModal'
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff, GripVertical, Upload, Image as ImageIcon } from 'lucide-react'

interface Tool {
  id: string
  name: string
  description: string | null
  category: string
  banner_url: string | null
  icon_url: string | null
  link: string | null
  badge: string | null
  badge_color: string
  sort_order: number
  visible: boolean
  created_at: string
}

const EMPTY: Omit<Tool, 'id' | 'created_at'> = {
  name: '', description: '', category: 'General', banner_url: null, icon_url: null,
  link: '', badge: '', badge_color: '#10B981', sort_order: 0, visible: true,
}

export default function AdminToolsPage() {
  const supabase = createClient()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tool | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bannerRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const { data } = await supabase.from('tools').select('*').order('category').order('sort_order')
    setTools((data || []) as Tool[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (t: Tool) => {
    setEditing(t)
    setForm({ name: t.name, description: t.description || '', category: t.category, banner_url: t.banner_url, icon_url: t.icon_url, link: t.link || '', badge: t.badge || '', badge_color: t.badge_color, sort_order: t.sort_order, visible: t.visible })
    setModalOpen(true)
  }

  const uploadBanner = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('tool-banners').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('tool-banners').getPublicUrl(path)
      setForm(f => ({ ...f, banner_url: publicUrl }))
    }
    setUploading(false)
  }

  const save = async () => {
    setSaving(true)
    const payload = { ...form, description: form.description || null, badge: form.badge || null, link: form.link || null, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('tools').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('tools').insert(payload)
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const deleteTool = async (id: string) => {
    if (!confirm('Delete this tool?')) return
    await supabase.from('tools').delete().eq('id', id)
    load()
  }

  const grouped = tools.reduce<Record<string, Tool[]>>((acc, t) => {
    ;(acc[t.category] ||= []).push(t)
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Tools</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tools visible to members</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 cursor-pointer" style={{ background: '#F24822' }}>
          <Plus size={16} /> Add Tool
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-gray-500">No tools yet. Add one to get started.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</h2>
            <div className="space-y-2">
              {items.map(t => (
                <div key={t.id} className="flex items-center gap-4 rounded-xl p-4 transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <GripVertical size={14} className="text-gray-600 shrink-0" />
                  {t.banner_url ? (
                    <img src={t.banner_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <ImageIcon size={16} className="text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm truncate">{t.name}</span>
                      {t.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: t.badge_color }}>{t.badge}</span>
                      )}
                      {!t.visible && <EyeOff size={12} className="text-gray-600" />}
                    </div>
                    {t.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{t.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.link && (
                      <a href={t.link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition cursor-pointer">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition cursor-pointer">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteTool(t.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Tool' : 'Add Tool'} size="lg" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer">Cancel</button>
          <button onClick={save} disabled={saving || !form.name} className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer" style={{ background: '#F24822' }}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tool / Link</label>
              <select value={form.link?.startsWith('/dashboard/tools/') ? form.link : '__custom'} onChange={e => setForm(f => ({ ...f, link: e.target.value === '__custom' ? '' : e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50 appearance-none cursor-pointer">
                <option value="/dashboard/tools/bible" className="bg-[#1a1a1a]">📊 The Bible</option>
                <option value="__custom" className="bg-[#1a1a1a]">Custom URL…</option>
              </select>
              {(!form.link || !form.link.startsWith('/dashboard/tools/')) && (
                <input value={form.link || ''} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50" />
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Banner Image</label>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadBanner(e.target.files[0]) }} />
            {form.banner_url ? (
              <div className="relative rounded-xl overflow-hidden" style={{ height: 120 }}>
                <img src={form.banner_url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => bannerRef.current?.click()} className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"><Upload size={14} /></button>
              </div>
            ) : (
              <button onClick={() => bannerRef.current?.click()} disabled={uploading} className="w-full py-6 rounded-xl border border-dashed border-white/10 text-gray-500 text-sm hover:border-white/20 hover:text-gray-400 transition cursor-pointer">
                {uploading ? 'Uploading…' : 'Click to upload banner'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Badge Text</label>
              <input value={form.badge || ''} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. Free" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Badge Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.badge_color} onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))} className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent" />
                <input value={form.badge_color} onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F24822]/50" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))} className={`relative w-10 h-5 rounded-full transition cursor-pointer ${form.visible ? 'bg-green-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-gray-400">Visible to members</span>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

'use client'
import { useRef, useState, useEffect } from 'react'
import AdminModal from './AdminModal'
import { createClient } from '@/lib/supabase/client'
import { ImageIcon, Upload, X } from 'lucide-react'

interface Phase {
  id: string
  title: string
  description: string | null
  banner_url: string | null
  sort_order: number
  created_at?: string
}

interface PhaseModalProps {
  open: boolean
  onClose: () => void
  /** Pass existing phase to edit; null to create */
  phase?: Phase | null
  nextSortOrder?: number
  onSaved: (phase: Phase) => void
}

export default function PhaseModal({ open, onClose, phase, nextSortOrder = 0, onSaved }: PhaseModalProps) {
  const isEdit = !!phase

  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [banner, setBanner]     = useState<string | null>(null)
  const [hidden, setHidden]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  /* Populate fields when editing */
  useEffect(() => {
    if (open) {
      setTitle(phase?.title ?? '')
      setDesc(phase?.description ?? '')
      setBanner(phase?.banner_url ?? null)
      setHidden(false)
    }
  }, [open, phase])

  const uploadFile = async (file: File, phaseId: string) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `phases/${phaseId}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
      setBanner(publicUrl)
      setUploading(false)
      return publicUrl
    }
    setUploading(false)
    return null
  }

  const handleFile = async (file: File) => {
    /* Preview immediately */
    const objectUrl = URL.createObjectURL(file)
    setBanner(objectUrl)
    /* We'll upload for real on save if creating, or immediately if editing */
    if (isEdit && phase) {
      await uploadFile(file, phase.id)
    } else {
      /* Store the file to upload after insert */
      pendingFileRef.current = file
    }
  }

  const pendingFileRef = useRef<File | null>(null)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)

    if (isEdit && phase) {
      /* Update existing */
      await supabase.from('phases').update({
        title: title.trim(),
        description: desc.trim() || null,
        banner_url: banner?.startsWith('blob:') ? phase.banner_url : banner,
      }).eq('id', phase.id)
      onSaved({ ...phase, title: title.trim(), description: desc.trim() || null, banner_url: banner?.startsWith('blob:') ? phase.banner_url : banner })
    } else {
      /* Create new */
      const { data, error } = await supabase.from('phases').insert({
        title: title.trim(),
        description: desc.trim() || null,
        sort_order: nextSortOrder,
      }).select().single()

      if (!error && data) {
        let finalBanner = null
        if (pendingFileRef.current) {
          finalBanner = await uploadFile(pendingFileRef.current, data.id)
          if (finalBanner) {
            await supabase.from('phases').update({ banner_url: finalBanner }).eq('id', data.id)
          }
        }
        pendingFileRef.current = null
        onSaved({ ...data, banner_url: finalBanner } as Phase)
      }
    }

    setSaving(false)
    onClose()
  }

  const footer = (
    <div className="flex gap-3 justify-end">
      <button
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/8 transition"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving || !title.trim()}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-orange text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed min-w-[80px]"
      >
        {saving ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Saving…
          </span>
        ) : isEdit ? 'Save Changes' : 'Create Phase'}
      </button>
    </div>
  )

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Phase' : 'Create Phase'}
      subtitle={isEdit ? 'Update the phase details below' : 'Add a new phase to the member journey'}
      footer={footer}
    >
      <div className="space-y-5">
        {/* Banner Upload Zone */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Cover Image</label>
          <div
            className={`relative rounded-xl overflow-hidden border-2 border-dashed transition-colors cursor-pointer
              ${dragOver ? 'border-brand-orange bg-brand-orange/5' : 'border-white/15 hover:border-white/30'}`}
            style={{ height: '160px' }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {banner ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-3">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
                    <Upload size={14} /> Change
                  </span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setBanner(null); pendingFileRef.current = null }}
                    className="bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-2 rounded-xl flex items-center"
                  >
                    <X size={14} />
                  </button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <ImageIcon size={22} className="text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">Click or drag to upload a cover image</p>
                <p className="text-xs text-gray-600">PNG, JPG, WebP — recommended 1600×400</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Phase Name <span className="text-red-400">*</span></label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            autoFocus
            placeholder="e.g. Brand Foundation"
            className="w-full bg-[#1f1f1f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange/60 focus:bg-[#222] transition text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Description</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="A short description of what members will accomplish in this phase…"
            rows={3}
            className="w-full bg-[#1f1f1f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange/60 focus:bg-[#222] transition text-sm resize-none"
          />
        </div>

        {/* Hidden toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-white/4 rounded-xl border border-white/8">
          <div>
            <p className="text-sm font-medium text-white">Hidden from members</p>
            <p className="text-xs text-gray-500 mt-0.5">Draft phases won't appear on member dashboards</p>
          </div>
          <button
            type="button"
            onClick={() => setHidden(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${hidden ? 'bg-brand-orange' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hidden ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </AdminModal>
  )
}

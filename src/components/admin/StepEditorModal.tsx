'use client'
import { useState, useEffect } from 'react'
import AdminModal from './AdminModal'
import TiptapEditor from './TiptapEditor'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Link2, Play, FileText, File, Video, ExternalLink } from 'lucide-react'

interface ResourceLink {
  title: string
  url: string
  type: string
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

interface StepEditorModalProps {
  open: boolean
  onClose: () => void
  /** Existing step to edit; null = create mode */
  step?: Step | null
  phaseId: string
  nextSortOrder?: number
  onSaved: (step: Step) => void
}

const LINK_TYPES = [
  { value: 'link',     label: 'Link',     icon: <Link2 size={12} /> },
  { value: 'pdf',      label: 'PDF',      icon: <FileText size={12} /> },
  { value: 'video',    label: 'Video',    icon: <Video size={12} /> },
  { value: 'doc',      label: 'Doc',      icon: <File size={12} /> },
  { value: 'template', label: 'Template', icon: <ExternalLink size={12} /> },
]

export default function StepEditorModal({
  open, onClose, step, phaseId, nextSortOrder = 0, onSaved,
}: StepEditorModalProps) {
  const isEdit = !!step
  const supabase = createClient()

  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState<Record<string, unknown> | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [links,    setLinks]    = useState<ResourceLink[]>([])
  const [hidden,   setHidden]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [tab,      setTab]      = useState<'content' | 'media' | 'resources'>('content')

  useEffect(() => {
    if (open) {
      setTitle(step?.title ?? '')
      setContent(step?.content ?? null)
      setVideoUrl(step?.video_url ?? '')
      setLinks(step?.resource_links ?? [])
      setHidden(false)
      setTab('content')
    }
  }, [open, step])

  const addLink = () => setLinks(p => [...p, { title: '', url: '', type: 'link' }])
  const updateLink = (i: number, k: keyof ResourceLink, v: string) =>
    setLinks(p => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  const removeLink = (i: number) => setLinks(p => p.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)

    const payload = {
      title: title.trim(),
      content: content ?? null,
      video_url: videoUrl.trim() || null,
      resource_links: links.filter(l => l.url.trim()).length > 0
        ? links.filter(l => l.url.trim())
        : null,
    }

    if (isEdit && step) {
      await supabase.from('phase_steps').update(payload).eq('id', step.id)
      onSaved({ ...step, ...payload })
    } else {
      const { data, error } = await supabase.from('phase_steps').insert({
        ...payload, phase_id: phaseId, sort_order: nextSortOrder,
      }).select().single()
      if (!error && data) onSaved(data as Step)
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
        ) : isEdit ? 'Save Changes' : 'Create Step'}
      </button>
    </div>
  )

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Step' : 'Add Step'}
      subtitle={isEdit ? 'Update the step content and settings' : 'Add a new step to this phase'}
      size="lg"
      footer={footer}
    >
      <div className="space-y-5">
        {/* Step Title */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Step Title <span className="text-red-400">*</span></label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            placeholder="e.g. Define Your Brand Identity"
            className="w-full bg-[#1f1f1f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange/60 focus:bg-[#222] transition text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-black/30 rounded-xl w-fit">
          {(['content', 'media', 'resources'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                tab === t
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab: Content */}
        {tab === 'content' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Rich Text Content</label>
            <TiptapEditor
              key={`${step?.id ?? 'new'}-content`}
              content={content}
              onChange={setContent}
              placeholder="Write the step content here — instructions, descriptions, tips…"
            />
          </div>
        )}

        {/* Tab: Media */}
        {tab === 'media' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                <Play size={11} className="inline mr-1.5 mb-0.5" />YouTube / Video URL
              </label>
              <input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=… or any video URL"
                className="w-full bg-[#1f1f1f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange/60 focus:bg-[#222] transition text-sm"
              />
              <p className="text-xs text-gray-600 mt-1.5">YouTube links will be embedded; other URLs shown as a play button.</p>
            </div>
          </div>
        )}

        {/* Tab: Resources */}
        {tab === 'resources' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                <Link2 size={11} className="inline mr-1.5 mb-0.5" />Resource Links
              </label>
              <button
                onClick={addLink}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/8 hover:bg-white/12 rounded-lg transition text-gray-300"
              >
                <Plus size={11} /> Add Link
              </button>
            </div>

            {links.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-white/10 text-gray-600 text-sm">
                <Link2 size={24} className="mb-2 opacity-40" />
                No resource links yet. Add PDFs, docs, templates, or any URL.
              </div>
            ) : (
              <div className="space-y-2.5">
                {links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 bg-white/4 rounded-xl border border-white/8">
                    {/* Type selector */}
                    <div className="flex flex-col gap-0.5">
                      <select
                        value={link.type}
                        onChange={e => updateLink(i, 'type', e.target.value)}
                        className="bg-[#1f1f1f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-brand-orange/60 w-24"
                      >
                        {LINK_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Fields */}
                    <div className="flex-1 space-y-2">
                      <input
                        value={link.title}
                        onChange={e => updateLink(i, 'title', e.target.value)}
                        placeholder="Display name"
                        className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange/60"
                      />
                      <input
                        value={link.url}
                        onChange={e => updateLink(i, 'url', e.target.value)}
                        placeholder="https://…"
                        className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange/60"
                      />
                    </div>
                    <button
                      onClick={() => removeLink(i)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition rounded-lg hover:bg-red-500/10 flex-shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-white/4 rounded-xl border border-white/8">
          <div>
            <p className="text-sm font-medium text-white">Hidden from members</p>
            <p className="text-xs text-gray-500 mt-0.5">Members won't see this step until you publish it</p>
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

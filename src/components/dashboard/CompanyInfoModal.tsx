'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  X, Building2, Save, AlertCircle, CheckCircle,
  Upload, FileText, Loader2, ChevronDown
} from 'lucide-react'

interface FormationDoc {
  name: string
  path: string
  url: string
}

interface Props {
  userId: string
  initialData: {
    brand_name: string | null
    company_name: string | null
    company_type: string | null
    ein: string | null
    company_address: string | null
  }
  onClose: () => void
  onSaved: (data: Partial<Props['initialData']>) => void
}

const COMPANY_TYPES = ['LLC', 'C Corp', 'S Corp', 'Sole Proprietorship', 'Partnership', 'Nonprofit', 'Other']

const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition'
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }

export default function CompanyInfoModal({ userId, initialData, onClose, onSaved }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    brand_name: initialData.brand_name || '',
    company_name: initialData.company_name || '',
    company_type: initialData.company_type || '',
    ein: initialData.ein || '',
    company_address: initialData.company_address || '',
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [recentDocs, setRecentDocs] = useState<FormationDoc[]>([])
  const [typeOpen, setTypeOpen] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({
        brand_name: form.brand_name.trim() || null,
        company_name: form.company_name.trim() || null,
        company_type: form.company_type || null,
        ein: form.ein.trim() || null,
        company_address: form.company_address.trim() || null,
      })
      .eq('id', userId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    onSaved({
      brand_name: form.brand_name.trim() || null,
      company_name: form.company_name.trim() || null,
      company_type: form.company_type || null,
      ein: form.ein.trim() || null,
      company_address: form.company_address.trim() || null,
    })
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const path = `${userId}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('formation-docs').upload(path, file, { upsert: false })
    if (upErr) {
      setUploadError(upErr.message)
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('formation-docs').getPublicUrl(path)
    setRecentDocs(prev => [...prev, { name: file.name, path, url: publicUrl }])
    setUploadSuccess(`"${file.name}" uploaded — our team will review and update your records.`)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,72,34,0.1)', border: '1px solid rgba(242,72,34,0.2)' }}>
              <Building2 size={14} style={{ color: '#F24822' }} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Company Information</h2>
              <p className="text-xs text-gray-500">Edit your project & company details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Project / Brand Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Project / Brand Name <span style={{ color: '#F24822' }}>*</span>
            </label>
            <input type="text" value={form.brand_name} onChange={e => set('brand_name', e.target.value)}
              placeholder="e.g. NovaBrew" className={inputCls} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(242,72,34,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* Legal Company Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Legal Company Name
            </label>
            <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)}
              placeholder="e.g. NovaBrew LLC (leave blank if not yet registered)"
              className={inputCls} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(242,72,34,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Company Type */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Company Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTypeOpen(p => !p)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between"
                style={{ ...inputStyle, color: form.company_type ? 'white' : '#4b5563' }}
              >
                <span>{form.company_type || 'Select entity type…'}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
              </button>
              {typeOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                  style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  {COMPANY_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => { set('company_type', t); setTypeOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/5 ${form.company_type === t ? 'text-white font-medium' : 'text-gray-400'}`}
                      style={form.company_type === t ? { color: '#F24822' } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* EIN */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              EIN (Employer Identification Number)
            </label>
            <input type="text" value={form.ein} onChange={e => set('ein', e.target.value)}
              placeholder="XX-XXXXXXX (leave blank if not yet obtained)"
              className={inputCls} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(242,72,34,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Registered Address */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Registered Address
            </label>
            <input type="text" value={form.company_address} onChange={e => set('company_address', e.target.value)}
              placeholder="Street, City, State, Zip (leave blank if not yet registered)"
              className={inputCls} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(242,72,34,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Formation documents upload */}
          <div className="border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Formation Documents
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Upload Articles of Incorporation, Operating Agreement, or other formation docs. Our team will review and update your records.
            </p>

            {/* Upload button */}
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition hover:opacity-90"
              style={{ background: 'rgba(242,72,34,0.08)', border: '1px dashed rgba(242,72,34,0.3)' }}
            >
              {uploading ? <Loader2 size={16} style={{ color: '#F24822' }} className="animate-spin" /> : <Upload size={16} style={{ color: '#F24822' }} />}
              <span className="text-sm" style={{ color: '#F24822' }}>
                {uploading ? 'Uploading…' : 'Click to upload document'}
              </span>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
            </label>

            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-start gap-2 p-3 rounded-xl text-xs"
                style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}
              >
                <CheckCircle size={13} className="shrink-0 mt-0.5" />
                {uploadSuccess}
              </motion.div>
            )}

            {uploadError && (
              <p className="mt-2 text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle size={12} /> {uploadError}
              </p>
            )}

            {/* Recent uploads */}
            {recentDocs.length > 0 && (
              <div className="mt-3 space-y-2">
                {recentDocs.map(doc => (
                  <div key={doc.path} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <FileText size={13} style={{ color: '#F24822' }} className="shrink-0" />
                    <span className="text-xs text-gray-300 truncate flex-1">{doc.name}</span>
                    <span className="text-[10px] text-green-500 shrink-0">Uploaded ✓</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
          >
            {saving ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : saved ? (
              <><CheckCircle size={14} /> Saved!</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { X, User, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  brand_name: string | null
  role: string
  onboarding_completed: boolean
}

interface Props {
  profile: Profile
  onClose: () => void
  onSave: (updated: Partial<Profile>) => void
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition'
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }

export default function SettingsModal({ profile, onClose, onSave }: Props) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null })
      .eq('id', profile.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    onSave({ full_name: fullName.trim() })
    setTimeout(() => setSaved(false), 2000)
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
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,72,34,0.1)', border: '1px solid rgba(242,72,34,0.2)' }}>
              <User size={14} style={{ color: '#F24822' }} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Account Settings</h2>
              <p className="text-xs text-gray-500">Manage your profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
            >
              {(fullName || profile.brand_name || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-white text-sm">{fullName || 'Member'}</p>
              {profile.brand_name && <p className="text-xs mt-0.5" style={{ color: '#F24822' }}>{profile.brand_name}</p>}
              <p className="text-xs text-gray-600 mt-0.5 capitalize">{profile.role}</p>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className={inputCls}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(242,72,34,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
        </div>
      </motion.div>
    </div>
  )
}

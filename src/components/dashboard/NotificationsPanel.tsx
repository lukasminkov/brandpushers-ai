'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, FileText, CheckCircle, Clock, Zap, RefreshCw,
  PenLine, AlertCircle
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────── */
interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  action_type: string | null
  action_data: Record<string, string> | null
  read: boolean
  created_at: string
}

interface Agreement {
  id: string
  agreement_html: string
  status: string
  sent_at: string
}

/* ─── Sign Agreement Modal ───────────────────────── */
function SignAgreementModal({
  agreementId,
  onClose,
  onSigned,
}: {
  agreementId: string
  onClose: () => void
  onSigned: () => void
}) {
  const supabase = createClient()
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [signerName, setSignerName] = useState('')
  const [consent, setConsent] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('equity_agreements')
      .select('id, agreement_html, status, sent_at')
      .eq('id', agreementId)
      .single()
      .then(({ data }) => {
        setAgreement(data as Agreement)
        setLoading(false)
      })
  }, [agreementId, supabase])

  const handleSign = async () => {
    if (!signerName.trim() || !consent) return
    setSigning(true)
    setError('')
    try {
      const res = await fetch('/api/sign-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreement_id: agreementId,
          signer_name: signerName.trim(),
          consent: 'I agree to this equity agreement and understand this constitutes a legal electronic signature under the ESIGN Act.',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to sign'); setSigning(false); return }
      setSigned(true)
      onSigned()
    } catch {
      setError('Network error — please try again')
      setSigning(false)
    }
  }

  return (
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
        style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,72,34,0.15)', border: '1px solid rgba(242,72,34,0.3)' }}>
              <FileText size={15} style={{ color: '#F24822' }} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Equity Agreement</h2>
              <p className="text-xs text-gray-500">Review and sign below</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F24822 transparent transparent transparent' }} />
            </div>
          ) : signed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Agreement Signed!</h3>
              <p className="text-gray-400 text-sm mb-6">Your signature has been recorded. The signed agreement is now in your Documents.</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
              >
                Close
              </button>
            </motion.div>
          ) : agreement?.status !== 'pending' ? (
            <div className="text-center py-12">
              <AlertCircle size={32} className="text-yellow-400 mx-auto mb-3" />
              <p className="text-white font-medium">This agreement is no longer pending</p>
              <p className="text-gray-500 text-sm mt-1">Status: {agreement?.status}</p>
            </div>
          ) : (
            <>
              {/* Agreement document */}
              <div className="rounded-xl overflow-hidden border border-white/10">
                <div className="bg-white overflow-y-auto" style={{ maxHeight: '40vh' }}>
                  <div dangerouslySetInnerHTML={{ __html: agreement?.agreement_html || '' }} />
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
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${consent ? 'border-transparent' : 'border-white/20'}`} style={consent ? { background: '#F24822' } : {}}>
                      {consent && <CheckCircle size={12} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition">
                    I agree to this equity agreement and understand this constitutes a legal electronic signature under the U.S. ESIGN Act.
                  </span>
                </label>

                {error && (
                  <p className="text-red-400 text-xs flex items-center gap-1.5">
                    <AlertCircle size={12} /> {error}
                  </p>
                )}

                <button
                  onClick={handleSign}
                  disabled={!signerName.trim() || !consent || signing}
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
  )
}

/* ─── Time formatter ─────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ─── Icon per type ──────────────────────────────── */
function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
    agreement: { icon: FileText, color: '#F24822', bg: 'rgba(242,72,34,0.15)' },
    phase_update: { icon: Zap, color: '#9B0EE5', bg: 'rgba(155,14,229,0.15)' },
    general: { icon: Bell, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  }
  const cfg = map[type] || map.general
  const Icon = cfg.icon
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      <Icon size={15} style={{ color: cfg.color }} />
    </div>
  )
}

/* ─── Main Panel ─────────────────────────────────── */
export default function NotificationsPanel({
  open,
  onClose,
  userId,
  onUnreadChange,
}: {
  open: boolean
  onClose: () => void
  userId: string
  onUnreadChange?: (count: number) => void
}) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [signingAgreementId, setSigningAgreementId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications((data || []) as Notification[])
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notif-panel-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, load])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    const unread = notifications.filter(n => !n.read && n.id !== id).length
    onUnreadChange?.(unread)
  }

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    onUnreadChange?.(0)
  }

  const handleClick = async (notif: Notification) => {
    await markRead(notif.id)
    if (notif.action_type === 'sign_agreement' && notif.action_data?.agreement_id) {
      setSigningAgreementId(notif.action_data.agreement_id)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-[240px] bottom-0 z-50 flex flex-col"
            style={{
              width: '340px',
              background: '#111111',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2.5">
                <Bell size={16} style={{ color: '#F24822' }} />
                <h2 className="font-semibold text-white text-sm">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#F24822' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-gray-500 hover:text-gray-300 transition px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={load}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition"
                  title="Refresh"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F24822 transparent transparent transparent' }} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Bell size={20} className="text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-600 mt-1">Updates from your program will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3 transition-colors hover:bg-white/[0.03] ${!notif.read ? 'bg-white/[0.02]' : ''}`}
                    >
                      <NotifIcon type={notif.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-snug ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: '#F24822' }} />
                          )}
                        </div>
                        {notif.message && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock size={10} className="text-gray-600" />
                          <span className="text-[10px] text-gray-600">{timeAgo(notif.created_at)}</span>
                          {notif.action_type === 'sign_agreement' && !notif.read && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(242,72,34,0.15)', color: '#F24822' }}>
                              Action required
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign agreement modal */}
      <AnimatePresence>
        {signingAgreementId && (
          <SignAgreementModal
            key={signingAgreementId}
            agreementId={signingAgreementId}
            onClose={() => setSigningAgreementId(null)}
            onSigned={() => {
              setSigningAgreementId(null)
              load()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

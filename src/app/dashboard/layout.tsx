'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, LogOut, Bell, Settings, Menu, X } from 'lucide-react'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import SettingsModal from '@/components/dashboard/SettingsModal'

interface Profile {
  id: string
  full_name: string
  brand_name: string | null
  role: string
  onboarding_completed: boolean
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, brand_name, role, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (data?.role !== 'member') { router.push('/pending'); return }

      setProfile(data as Profile)
      if (!data?.onboarding_completed) setShowOnboarding(true)
      setLoading(false)
    })()
  }, [router, supabase])

  // Load unread notification count
  const loadUnreadCount = useCallback(async (profileId: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId)
      .eq('read', false)
    setUnreadCount(count || 0)
  }, [supabase])

  useEffect(() => {
    if (!profile) return
    loadUnreadCount(profile.id)

    const channel = supabase
      .channel(`layout-notif-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, () => loadUnreadCount(profile.id))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, () => loadUnreadCount(profile.id))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile, loadUnreadCount, supabase])

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  const nav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
  ]

  const initial = (profile?.full_name || profile?.brand_name || 'M').charAt(0).toUpperCase()

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <img src="/logo.svg" alt="BP" width={32} height={32} className="rounded-xl shrink-0" />
        <span className="font-bold text-sm" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F57B18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BrandPushers</span>
      </div>
      <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto">
        {nav.map(n => {
          const active = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer focus-ring ${active ? 'text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'}`}
              style={active ? { background: 'rgba(242,72,34,0.12)', border: '1px solid rgba(242,72,34,0.2)' } : {}}
            >
              <n.icon size={16} style={active ? { color: '#F24822' } : {}} />
              <span>{n.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-3 space-y-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => setNotificationsOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all duration-200 cursor-pointer">
          <Bell size={15} />
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold" style={{ background: '#F24822' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl min-w-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}>{initial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{profile?.full_name || 'Member'}</p>
              {profile?.brand_name && <p className="text-[10px] truncate" style={{ color: '#F24822' }}>{profile.brand_name}</p>}
            </div>
          </div>
          <button onClick={() => setSettingsOpen(true)} title="Settings" className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all shrink-0 cursor-pointer">
            <Settings size={15} />
          </button>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer">
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>

      {/* ── Mobile header ────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="BP" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-sm" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F57B18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BrandPushers</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setNotificationsOpen(true)} className="relative p-2 text-gray-400 hover:text-white transition cursor-pointer">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#F24822' }} />
            )}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white transition cursor-pointer">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside
            className="md:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col"
            style={{ width: '260px', background: '#0e0e14', borderRight: '1px solid rgba(255,255,255,0.06)' }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col border-r shrink-0 sticky top-0 h-screen"
        style={{ width: '240px', borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        {sidebarContent}
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0" style={{ overflowX: 'hidden' }}>
        {children}
      </main>

      {/* ── Onboarding overlay ───────────────────────── */}
      {showOnboarding && profile && (
        <OnboardingWizard
          userId={profile.id}
          initialFullName={profile.full_name || ''}
          onComplete={() => {
            setShowOnboarding(false)
            supabase
              .from('profiles')
              .select('id, full_name, brand_name, role, onboarding_completed')
              .eq('id', profile.id)
              .single()
              .then(({ data }) => { if (data) setProfile(data as Profile) })
          }}
        />
      )}

      {/* ── Notifications panel ──────────────────────── */}
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        userId={profile?.id || ''}
        onUnreadChange={setUnreadCount}
      />

      {/* ── Settings modal ───────────────────────────── */}
      {settingsOpen && profile && (
        <SettingsModal
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onSave={updated => {
            setProfile(prev => (prev ? { ...prev, ...updated } : prev))
            setSettingsOpen(false)
          }}
        />
      )}
    </div>
  )
}

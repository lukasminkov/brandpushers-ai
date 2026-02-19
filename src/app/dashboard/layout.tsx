'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, BookOpen, FileText, LogOut, Settings,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

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
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, brand_name, role, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (data?.role !== 'member') {
        router.push('/pending')
        return
      }

      setProfile(data as Profile)

      // Show onboarding if not completed
      if (!data?.onboarding_completed) {
        setShowOnboarding(true)
      }

      setLoading(false)
    })()
  }, [router, supabase])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Refresh profile
    supabase
      .from('profiles')
      .select('id, full_name, brand_name, role, onboarding_completed')
      .eq('id', profile!.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile)
      })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#F24822 transparent transparent transparent' }}
          />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  const nav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/resources', icon: BookOpen, label: 'Program' },
    { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r transition-all duration-300 shrink-0"
        style={{
          width: collapsed ? '72px' : '240px',
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b ${collapsed ? 'justify-center' : ''}`}
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
          >
            <Zap size={14} className="text-white" />
          </div>
          {!collapsed && (
            <span
              className="font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #9B0EE5, #F57B18)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BrandPushers
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const isActive = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
            return (
              <Link
                key={n.href}
                href={n.href}
                title={collapsed ? n.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
                style={
                  isActive
                    ? {
                        background: 'rgba(242,72,34,0.12)',
                        border: '1px solid rgba(242,72,34,0.2)',
                      }
                    : {}
                }
              >
                <n.icon
                  size={16}
                  className={isActive ? 'text-brand-orange' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}
                  style={isActive ? { color: '#F24822' } : {}}
                />
                {!collapsed && <span>{n.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Profile mini + signout */}
        <div className="p-3 space-y-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {!collapsed && profile && (
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
              >
                {(profile.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{profile.full_name || 'Member'}</p>
                {profile.brand_name && (
                  <p className="text-xs truncate" style={{ color: '#F24822' }}>{profile.brand_name}</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/')
            }}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full border flex items-center justify-center transition-all hover:scale-110 z-10"
          style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {collapsed ? <ChevronRight size={12} className="text-gray-400" /> : <ChevronLeft size={12} className="text-gray-400" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Onboarding overlay */}
      {showOnboarding && profile && (
        <OnboardingWizard
          userId={profile.id}
          initialFullName={profile.full_name || ''}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  )
}

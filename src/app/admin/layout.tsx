'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Users, Layers, Wrench, LogOut, Menu, X } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data?.role !== 'admin') { router.push('/'); return }
      setOk(true)
    })()
  }, [router, supabase])

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  if (!ok) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-gray-500 text-sm">Loading admin…</p>
      </div>
    </div>
  )

  const nav = [
    { href: '/admin/members', icon: Users, label: 'Members' },
    { href: '/admin', icon: LayoutDashboard, label: 'Applications' },
    { href: '/admin/phases', icon: Layers, label: 'Program' },
    { href: '/admin/tools', icon: Wrench, label: 'Tools' },
  ]

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <Image src="/logo.svg" alt="BP" width={32} height={32} className="rounded-xl shrink-0" />
        <span
          className="font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, #9B0EE5, #F57B18)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto">
        {nav.map(n => {
          const active = isActive(n.href)
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer focus-ring ${
                active
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              }`}
              style={
                active
                  ? {
                      background: 'rgba(242,72,34,0.12)',
                      border: '1px solid rgba(242,72,34,0.2)',
                    }
                  : {}
              }
            >
              <n.icon
                size={16}
                style={active ? { color: '#F24822' } : {}}
              />
              <span>{n.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col border-r shrink-0 sticky top-0 h-screen"
        style={{
          width: '240px',
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="BP" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-sm" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F57B18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white transition cursor-pointer">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
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

      {/* Main content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-16 md:pt-8" style={{ overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, BookOpen, FileText, LogOut } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data?.role !== 'member') { router.push('/pending'); return }
      setOk(true)
    })()
  }, [router, supabase])

  if (!ok) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>

  const nav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/resources', icon: BookOpen, label: 'Resources' },
    { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
  ]

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
        <Link href="/dashboard" className="flex items-center gap-3 mb-8">
          <Image src="/logo.svg" alt="BP" width={32} height={32} />
          <span className="font-bold bg-logo-gradient bg-clip-text text-transparent">Dashboard</span>
        </Link>
        <nav className="flex-1 space-y-2">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
              <n.icon size={18} />
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 transition">
          <LogOut size={18} /> Sign Out
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}

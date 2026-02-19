'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Settings, LogOut } from 'lucide-react'

export default function PortalNav({ email }: { email: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="border-b border-white/5 bg-[var(--bg-dark)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/portal/dashboard" className="text-xl font-bold tracking-tight">
            Brand<span className="gradient-text">Pushers</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/portal/dashboard"
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/portal/settings"
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[var(--text-secondary)]">{email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}

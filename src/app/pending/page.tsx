'use client'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function PendingPage() {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Link href="/" className="flex items-center gap-3 justify-center mb-8">
          <Image src="/logo.svg" alt="BrandPushers" width={40} height={40} />
        </Link>
        <Clock className="text-brand-orange mx-auto mb-4" size={64} />
        <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
        <p className="text-gray-400 mb-8">Your application is being reviewed by our team. We&apos;ll notify you by email once you&apos;re approved.</p>
        <button onClick={handleSignOut} className="px-6 py-3 glass rounded-xl hover:bg-white/10 transition">Sign Out</button>
      </div>
    </div>
  )
}

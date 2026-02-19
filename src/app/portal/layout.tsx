import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PortalNav from '@/components/portal/portal-nav'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      <PortalNav email={user.email ?? ''} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}

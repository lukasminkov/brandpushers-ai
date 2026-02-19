'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string; email: string; full_name: string; approved_at: string
  member_phases?: { status: string; phases: { name: string } }[]
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*, member_phases(status, phases(name))').eq('role', 'member').order('approved_at', { ascending: false })
      setMembers((data || []) as Member[])
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Members</h1>
      {members.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">No approved members yet</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {members.map(m => (
            <div key={m.id} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold">{m.full_name || 'Unknown'}</h3>
              <p className="text-gray-400 text-sm">{m.email}</p>
              <p className="text-gray-500 text-xs mt-1">Approved: {m.approved_at ? new Date(m.approved_at).toLocaleDateString() : 'N/A'}</p>
              {m.member_phases && m.member_phases.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.member_phases.map((mp, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded-full ${mp.status === 'completed' ? 'bg-green-500/20 text-green-400' : mp.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {mp.phases?.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

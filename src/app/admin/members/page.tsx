'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users, Search, ChevronRight, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface MemberRow {
  id: string
  email: string
  full_name: string
  role: string
  brand_name: string | null
  onboarding_completed: boolean
  created_at: string
  latest_equity_pct: number | null
}

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    member: 'bg-green-500/15 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  }
  return map[role] || map.pending
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      // Get all members + admins
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, brand_name, onboarding_completed, created_at')
        .in('role', ['member', 'admin'])
        .order('created_at', { ascending: false })

      if (!profiles) { setLoading(false); return }

      // Get latest signed agreement snapshot for equity %
      const memberIds = profiles.map(p => p.id)
      const { data: agreements } = await supabase
        .from('equity_agreements')
        .select('brand_member_id, total_equity_snapshot, status')
        .in('brand_member_id', memberIds)
        .eq('status', 'signed')
        .order('signed_at', { ascending: false })

      // Build equity map (first signed agreement per member = latest)
      const equityMap: Record<string, number | null> = {}
      if (agreements) {
        for (const a of agreements) {
          if (equityMap[a.brand_member_id] !== undefined) continue
          // Find BrandPushers stake in snapshot
          const snapshot = a.total_equity_snapshot as Array<{ name: string; percentage: number }> | null
          if (snapshot) {
            // Look for a stake that isn't the member themselves
            const bpStake = snapshot.find(s => s.name?.toLowerCase().includes('brandpushers') || s.name?.toLowerCase().includes('whut'))
            equityMap[a.brand_member_id] = bpStake?.percentage ?? null
          }
        }
      }

      // Also check equity_stakes for current equity if no signed agreement
      const { data: stakes } = await supabase
        .from('equity_stakes')
        .select('brand_member_id, stakeholder_name, equity_percentage, is_member')
        .in('brand_member_id', memberIds)

      const stakeMap: Record<string, number> = {}
      if (stakes) {
        for (const s of stakes) {
          if (!stakeMap[s.brand_member_id]) stakeMap[s.brand_member_id] = 0
          stakeMap[s.brand_member_id] += Number(s.equity_percentage)
        }
      }

      const rows: MemberRow[] = profiles.map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: p.role,
        brand_name: p.brand_name,
        onboarding_completed: p.onboarding_completed ?? false,
        created_at: p.created_at,
        latest_equity_pct: equityMap[p.id] ?? (stakeMap[p.id] ? stakeMap[p.id] : null),
      }))

      setMembers(rows)
      setLoading(false)
    })()
  }, [supabase])

  const filtered = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.brand_name?.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    )
  })

  const onboardedCount = members.filter(m => m.onboarding_completed).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-gray-500 text-sm mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''} · <span className="text-green-400">{onboardedCount} onboarded</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:border-[#F24822]/50 transition"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          {search ? 'No members match your search' : 'No members yet'}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_100px_140px_100px_100px_100px_80px] gap-2 px-5 py-3 border-b border-white/[0.07] text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Brand</span>
            <span>Onboarding</span>
            <span>Equity</span>
            <span>Joined</span>
            <span></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filtered.map(m => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_1fr_100px_140px_100px_100px_100px_80px] gap-2 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-colors group"
              >
                {/* Name + avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
                  >
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-sm truncate">{m.full_name || '—'}</span>
                </div>

                {/* Email */}
                <span className="text-sm text-gray-400 truncate">{m.email}</span>

                {/* Role */}
                <span>
                  <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium border ${roleBadge(m.role)}`}>
                    {m.role}
                  </span>
                </span>

                {/* Brand */}
                <span className="text-sm truncate" style={{ color: m.brand_name ? '#F24822' : undefined }}>
                  {m.brand_name || <span className="text-gray-600">—</span>}
                </span>

                {/* Onboarding */}
                <span>
                  {m.onboarding_completed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                      <CheckCircle size={11} /> Done
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-yellow-400">
                      <Clock size={11} /> Pending
                    </span>
                  )}
                </span>

                {/* Equity */}
                <span className="text-sm font-medium tabular-nums">
                  {m.latest_equity_pct != null ? (
                    <span style={{ color: '#9B0EE5' }}>{m.latest_equity_pct}%</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </span>

                {/* Joined */}
                <span className="text-xs text-gray-500">
                  {m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                </span>

                {/* Manage button */}
                <button
                  onClick={() => router.push(`/admin/members/${m.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  Manage <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

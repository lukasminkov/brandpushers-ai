'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader, Building2, FileText } from 'lucide-react'

interface MemberPhase {
  id: string
  status: string
  notes: string | null
  phases: { name: string; description: string; order: number }
}

interface Profile {
  full_name: string
  brand_name: string | null
  equity_percentage: number | null
  fee_amount: number | null
  equity_agreed: boolean
}

export default function DashboardPage() {
  const [phases, setPhases] = useState<MemberPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, brand_name, equity_percentage, fee_amount, equity_agreed')
        .eq('id', user.id)
        .single()
      setProfile(p)
      const { data } = await supabase
        .from('member_phases')
        .select('*, phases(name, description, order)')
        .eq('member_id', user.id)
        .order('phases(order)')
      setPhases((data || []) as MemberPhase[])
      setLoading(false)
    })()
  }, [])

  const completed = phases.filter(p => p.status === 'completed').length
  const total = phases.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const hasEquityInfo = profile?.equity_percentage != null || profile?.brand_name

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
      </h1>
      <p className="text-gray-400 mb-8">Track your brand-building progress below.</p>

      {/* Equity / Partnership Card */}
      {hasEquityInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6 border border-brand-purple/20"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-logo-gradient flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Your Partnership with BrandPushers</h3>

              {profile?.brand_name && (
                <p className="text-brand-orange font-medium mb-2">{profile.brand_name}</p>
              )}

              {profile?.equity_percentage != null && (
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-white">{profile.equity_percentage}%</span>
                  <span className="text-gray-400 text-sm">BrandPushers equity stake</span>
                </div>
              )}

              {profile?.equity_percentage != null && (
                <div className="rounded-xl bg-dark-700 border border-white/10 p-4 mb-3">
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white mb-1">Operating Agreement Reminder</p>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        <strong className="text-white">BrandPushers (WHUT.AI LLC)</strong> holds{' '}
                        <strong className="text-brand-orange">{profile.equity_percentage}%</strong> equity in{' '}
                        <strong className="text-white">{profile.brand_name || 'your company'}</strong>.{' '}
                        Please ensure this is reflected in your company&apos;s operating agreement, cap table, or shareholder agreement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profile?.fee_amount != null && (
                <p className="text-sm text-gray-500">
                  Program fee: <span className="text-gray-300 font-medium">${profile.fee_amount.toLocaleString()} USD</span>
                </p>
              )}

              {profile?.equity_agreed && (
                <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                  <CheckCircle size={14} />
                  <span>Equity terms confirmed</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Overall Progress</h3>
          <span className="text-brand-orange font-bold">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-logo-gradient rounded-full"
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">{completed} of {total} phases completed</p>
      </div>

      {/* Phase list */}
      <div className="space-y-3">
        {phases.map((mp, i) => (
          <motion.div
            key={mp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 flex items-center gap-4"
          >
            <div className="shrink-0">
              {mp.status === 'completed' ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : mp.status === 'in_progress' ? (
                <Loader className="text-blue-400 animate-spin" size={24} />
              ) : (
                <Circle className="text-gray-600" size={24} />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{mp.phases.name}</h4>
              {mp.phases.description && (
                <p className="text-gray-500 text-sm">{mp.phases.description}</p>
              )}
              {mp.notes && (
                <p className="text-gray-400 text-sm mt-1 italic">{mp.notes}</p>
              )}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              mp.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : mp.status === 'in_progress'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {mp.status.replace('_', ' ')}
            </span>
          </motion.div>
        ))}

        {phases.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-gray-500">
            No phases assigned yet. Your admin will set up your program phases soon.
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Users, Eye, Zap, ArrowUpRight, Clock } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User | null
}

const stats = [
  {
    label: 'Reach This Month',
    value: '24,801',
    change: '+18%',
    trend: 'up',
    icon: Eye,
    gradient: 'from-[#9B0EE5] to-[#6B0EE5]',
  },
  {
    label: 'New Followers',
    value: '1,243',
    change: '+32%',
    trend: 'up',
    icon: Users,
    gradient: 'from-[#F24822] to-[#9B0EE5]',
  },
  {
    label: 'Campaigns Active',
    value: '6',
    change: '2 scheduled',
    trend: 'neutral',
    icon: Zap,
    gradient: 'from-[#F57B18] to-[#F24822]',
  },
  {
    label: 'Engagement Rate',
    value: '5.4%',
    change: '+0.8%',
    trend: 'up',
    icon: TrendingUp,
    gradient: 'from-[#9B0EE5] to-[#F57B18]',
  },
]

const recentActivity = [
  { time: '2h ago', text: 'Campaign "Spring Launch" published to 3 channels', type: 'success' },
  { time: '5h ago', text: 'AI generated 12 new content drafts', type: 'info' },
  { time: '1d ago', text: 'Analytics report for February ready', type: 'info' },
  { time: '1d ago', text: 'Brand voice model updated', type: 'success' },
  { time: '2d ago', text: 'Connected Instagram @yourbrand', type: 'success' },
]

export function DashboardOverview({ user }: Props) {
  const firstName = user?.email?.split('@')[0] || 'there'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, <span className="text-[#F24822]">{firstName}</span> 👋
        </h1>
        <p className="text-white/40 text-sm">
          Here&apos;s what&apos;s happening with your brand today.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}
                >
                  <Icon size={16} className="text-white" />
                </div>
                {stat.trend === 'up' && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
                    <ArrowUpRight size={12} />
                    {stat.change}
                  </div>
                )}
                {stat.trend === 'neutral' && (
                  <div className="text-white/30 text-xs bg-white/5 px-2 py-1 rounded-full">
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03]"
        >
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Clock size={14} className="text-[#F24822]" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                    item.type === 'success' ? 'bg-emerald-400' : 'bg-[#9B0EE5]'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70">{item.text}</p>
                  <p className="text-xs text-white/30 mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03]"
        >
          <h2 className="text-sm font-semibold text-white mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Create Campaign', gradient: 'from-[#9B0EE5] to-[#F24822]' },
              { label: 'Generate Content', gradient: 'from-[#F24822] to-[#F57B18]' },
              { label: 'View Analytics', gradient: 'from-[#9B0EE5] to-[#6B0EE5]' },
              { label: 'Manage Channels', gradient: 'from-[#F57B18] to-[#9B0EE5]' },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all text-left group"
              >
                <div
                  className={`w-2 h-2 rounded-full bg-gradient-to-r ${action.gradient} flex-shrink-0`}
                />
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                  {action.label}
                </span>
                <ArrowUpRight
                  size={14}
                  className="ml-auto text-white/20 group-hover:text-white/50 transition-colors"
                />
              </button>
            ))}
          </div>

          {/* Upgrade nudge */}
          <div
            className="mt-6 p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(155,14,229,0.15), rgba(242,72,34,0.1))',
              border: '1px solid rgba(155,14,229,0.2)',
            }}
          >
            <p className="text-xs font-semibold text-white mb-1">🚀 Unlock Growth</p>
            <p className="text-xs text-white/50 mb-3">
              Upgrade to Growth plan for unlimited AI generations and advanced analytics.
            </p>
            <button
              className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
            >
              Upgrade Now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

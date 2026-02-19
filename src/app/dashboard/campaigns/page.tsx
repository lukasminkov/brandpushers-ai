'use client'

import { motion } from 'framer-motion'
import { Plus, Megaphone, Play, Pause, CheckCircle, Clock } from 'lucide-react'

const campaigns = [
  {
    name: 'Spring Launch 2026',
    status: 'active',
    channels: ['Instagram', 'TikTok', 'LinkedIn'],
    reach: '8,204',
    engagement: '6.2%',
    started: 'Feb 15',
  },
  {
    name: 'Brand Awareness Q1',
    status: 'active',
    channels: ['Twitter', 'LinkedIn'],
    reach: '12,450',
    engagement: '4.8%',
    started: 'Feb 01',
  },
  {
    name: 'Product Teaser Series',
    status: 'paused',
    channels: ['Instagram', 'TikTok'],
    reach: '3,100',
    engagement: '5.1%',
    started: 'Jan 28',
  },
  {
    name: 'Email Nurture Flow',
    status: 'scheduled',
    channels: ['Email'],
    reach: '—',
    engagement: '—',
    started: 'Mar 01',
  },
  {
    name: 'Year-End Wrap',
    status: 'completed',
    channels: ['Instagram', 'Twitter', 'Email'],
    reach: '24,000',
    engagement: '7.3%',
    started: 'Dec 10',
  },
]

const statusConfig = {
  active: { label: 'Active', icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  paused: { label: 'Paused', icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  scheduled: { label: 'Scheduled', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-white/30', bg: 'bg-white/5' },
}

export default function CampaignsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Campaigns</h1>
          <p className="text-white/40 text-sm">Manage and track your brand campaigns.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white text-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
        >
          <Plus size={16} />
          New Campaign
        </button>
      </motion.div>

      {/* Campaign list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-xs font-medium text-white/30 uppercase tracking-wider">
          <div className="col-span-4">Campaign</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Channels</div>
          <div className="col-span-2">Reach</div>
          <div className="col-span-1">Engagement</div>
          <div className="col-span-1">Started</div>
        </div>

        {/* Rows */}
        {campaigns.map((campaign, i) => {
          const status = statusConfig[campaign.status as keyof typeof statusConfig]
          const StatusIcon = status.icon
          return (
            <motion.div
              key={campaign.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center cursor-pointer"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9B0EE5]/20 to-[#F24822]/20 border border-white/[0.06] flex items-center justify-center">
                  <Megaphone size={14} className="text-[#F24822]" />
                </div>
                <span className="text-sm font-medium text-white">{campaign.name}</span>
              </div>
              <div className="col-span-2">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}
                >
                  <StatusIcon size={11} />
                  {status.label}
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex flex-wrap gap-1">
                  {campaign.channels.slice(0, 2).map((ch) => (
                    <span
                      key={ch}
                      className="text-xs text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-md"
                    >
                      {ch}
                    </span>
                  ))}
                  {campaign.channels.length > 2 && (
                    <span className="text-xs text-white/30">+{campaign.channels.length - 2}</span>
                  )}
                </div>
              </div>
              <div className="col-span-2 text-sm text-white/60">{campaign.reach}</div>
              <div className="col-span-1 text-sm text-white/60">{campaign.engagement}</div>
              <div className="col-span-1 text-xs text-white/30">{campaign.started}</div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

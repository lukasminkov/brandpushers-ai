'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Eye, Users, Heart, Share2 } from 'lucide-react'

const channelStats = [
  { channel: 'Instagram', followers: '12,400', reach: '44.2K', engagement: '5.8%', trend: 'up' },
  { channel: 'TikTok', followers: '8,200', reach: '31.1K', engagement: '7.2%', trend: 'up' },
  { channel: 'LinkedIn', followers: '3,600', reach: '9.4K', engagement: '3.1%', trend: 'up' },
  { channel: 'Twitter/X', followers: '5,100', reach: '7.8K', engagement: '2.4%', trend: 'down' },
]

const topContent = [
  { title: 'Brand Origin Story (Reel)', channel: 'Instagram', reach: '18.4K', likes: '2,341' },
  { title: '5 AI Tools We Use Daily', channel: 'LinkedIn', reach: '9.1K', likes: '842' },
  { title: 'Behind the Scenes', channel: 'TikTok', reach: '14.2K', likes: '3,102' },
  { title: 'Product Launch Teaser', channel: 'Instagram', reach: '8.6K', likes: '1,240' },
]

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-white/40 text-sm">Performance overview across all your channels.</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Reach', value: '92.5K', icon: Eye, change: '+22%' },
          { label: 'Total Followers', value: '29.3K', icon: Users, change: '+14%' },
          { label: 'Total Likes', value: '7,525', icon: Heart, change: '+31%' },
          { label: 'Total Shares', value: '1,203', icon: Share2, change: '+9%' },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9B0EE5]/30 to-[#F24822]/30 flex items-center justify-center">
                  <Icon size={14} className="text-white/70" />
                </div>
                <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  {card.change}
                </span>
              </div>
              <div className="text-xl font-bold text-white">{card.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{card.label}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
        >
          <h2 className="text-sm font-semibold text-white mb-5">Channel Performance</h2>
          <div className="space-y-4">
            {channelStats.map((ch) => (
              <div key={ch.channel} className="flex items-center gap-4">
                <div className="w-24 text-sm text-white/60">{ch.channel}</div>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(parseFloat(ch.engagement) / 8) * 100}%`,
                      background: 'linear-gradient(90deg, #9B0EE5, #F24822)',
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 w-16 text-right">
                  {ch.trend === 'up' ? (
                    <TrendingUp size={12} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={12} className="text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${ch.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ch.engagement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
        >
          <h2 className="text-sm font-semibold text-white mb-5">Top Performing Content</h2>
          <div className="space-y-4">
            {topContent.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F24822] mt-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white/80 truncate">{item.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">{item.channel}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-xs text-white/50">{item.reach} reach</span>
                  <span className="text-xs text-white/30">{item.likes} ❤️</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

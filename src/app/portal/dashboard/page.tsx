'use client'

import { motion } from 'framer-motion'
import { Zap, Target, BarChart3, Bot } from 'lucide-react'

const cards = [
  { icon: Bot, title: 'AI Strategy', desc: 'Generate brand strategies', color: 'from-purple-500 to-violet-600' },
  { icon: Target, title: 'Audience Intel', desc: 'Analyze your audience', color: 'from-orange-500 to-red-600' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track brand growth', color: 'from-blue-500 to-cyan-600' },
  { icon: Zap, title: 'Quick Actions', desc: 'Launch campaigns fast', color: 'from-emerald-500 to-green-600' },
]

export default function DashboardPage() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Welcome to Brand Pushers AI portal.</p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer rounded-2xl border border-white/5 bg-[var(--bg-card)] p-6 transition-all hover:border-white/10 hover:bg-[var(--bg-card-hover)]"
          >
            <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-r ${card.color} p-3`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold">{card.title}</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{card.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 rounded-2xl border border-white/5 bg-[var(--bg-card)] p-8 text-center"
      >
        <p className="text-[var(--text-secondary)]">
          🚀 More tools and features coming soon. This portal is actively being built.
        </p>
      </motion.div>
    </div>
  )
}

'use client'
import { motion } from 'framer-motion'
import { Lightbulb, Rocket, TrendingUp, DollarSign } from 'lucide-react'

const journey = [
  {
    icon: Lightbulb,
    phase: '01 — IDEA',
    title: 'Validate & Position',
    desc: 'You bring the vision. We pressure-test it, find the market gap, and position your brand for a TikTok-first launch. AI tools identify trends, niches, and audience segments before you spend a dollar.',
    tags: ['Market Research', 'Brand Identity', 'AI Trend Analysis'],
  },
  {
    icon: Rocket,
    phase: '02 — LAUNCH',
    title: 'Build & Go Live',
    desc: 'We build your brand alongside you — from product sourcing to content strategy to storefront. Our AI-powered content engine gets you to first sales within weeks, not months.',
    tags: ['Content Creation', 'TikTok Shop Setup', 'AI Content Engine'],
  },
  {
    icon: TrendingUp,
    phase: '03 — SCALE',
    title: 'Grow & Dominate',
    desc: 'Once we have proof of concept, we pour fuel on the fire. Paid ads, creator partnerships, community flywheel, and AI-optimized campaigns to turn your brand into a market leader.',
    tags: ['Paid Ads', 'Creator Network', 'Community Building'],
  },
  {
    icon: DollarSign,
    phase: '04 — EXIT',
    title: 'Maximize & Exit',
    desc: 'We build with an exit in mind from day one. Whether it\'s acquisition, licensing, or scaling to 8 figures — we position your brand to maximize the outcome for both of us.',
    tags: ['M&A Strategy', 'Brand Valuation', 'Exit Planning'],
  },
]

export default function WhatWeDo() {
  return (
    <section id="what-we-do" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            The <span className="bg-logo-gradient bg-clip-text text-transparent">Journey</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We partner with you as equity co-builders at every stage — from raw idea to profitable exit. This isn&apos;t a service. It&apos;s a partnership.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {journey.map((stage, i) => (
            <motion.div
              key={stage.phase}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass rounded-2xl p-8 group cursor-default"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-orange/20 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/30 transition">
                  <stage.icon className="text-brand-orange" size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-orange tracking-widest mb-1">{stage.phase}</div>
                  <h3 className="text-xl font-bold">{stage.title}</h3>
                </div>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">{stage.desc}</p>
              <div className="flex flex-wrap gap-2">
                {stage.tags.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 glass rounded-2xl p-8 text-center border border-brand-orange/20"
        >
          <p className="text-lg text-gray-300 font-medium">
            🤝 <span className="text-white font-bold">We take equity, not just fees.</span> That means we&apos;re all-in on your success — our incentives are perfectly aligned with yours.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

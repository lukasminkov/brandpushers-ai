'use client'
import { motion } from 'framer-motion'
import { Lightbulb, Rocket, TrendingUp, DollarSign } from 'lucide-react'

const stages = [
  {
    icon: Lightbulb,
    phase: '01',
    title: 'Idea',
    subtitle: 'Validate & Position',
    desc: 'You bring the vision. We pressure-test it, find the market gap, and position your brand for a TikTok-first launch.',
    tools: ['Market Research', 'Brand Identity', 'AI Trend Analysis'],
    color: '#9B0EE5',
  },
  {
    icon: Rocket,
    phase: '02',
    title: 'Launch',
    subtitle: 'Build & Go Live',
    desc: 'We build your brand alongside you — from product sourcing to content strategy to storefront. First sales within weeks.',
    tools: ['Content Creation', 'TikTok Shop', 'AI Content Engine'],
    color: '#C02AE5',
  },
  {
    icon: TrendingUp,
    phase: '03',
    title: 'Scale',
    subtitle: 'Grow & Dominate',
    desc: 'Paid ads, creator partnerships, community flywheel, and AI-optimized campaigns to turn your brand into a market leader.',
    tools: ['Paid Ads', 'Creator Network', 'Community Building'],
    color: '#F24822',
  },
  {
    icon: DollarSign,
    phase: '04',
    title: 'Exit',
    subtitle: 'Maximize & Exit',
    desc: 'Built with an exit in mind from day one. Acquisition, licensing, or 8-figure scale — we maximize the outcome together.',
    tools: ['M&A Strategy', 'Brand Valuation', 'Exit Planning'],
    color: '#F57B18',
  },
]

export default function Journey() {
  return (
    <section id="journey" className="relative py-28 px-6 overflow-hidden">
      {/* Section background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#9B0EE5]/8 rounded-full blur-[200px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-[#F24822] mb-4 block">
            The Journey
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5">
            From <span className="gradient-text">Idea</span> to <span className="gradient-text">Exit</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            We partner as equity co-builders at every stage. This isn&apos;t a service — it&apos;s a partnership with skin in the game.
          </p>
        </motion.div>

        {/* Timeline connector (desktop only) */}
        <div className="hidden lg:block relative mb-8">
          <div className="absolute top-[60px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-[#9B0EE5]/40 via-[#F24822]/40 to-[#F57B18]/40" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stages.map((stage, i) => (
            <motion.div
              key={stage.phase}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-7 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
                {/* Phase number + icon */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300"
                    style={{ background: `${stage.color}15`, border: `1px solid ${stage.color}25` }}
                  >
                    <stage.icon size={20} style={{ color: stage.color }} />
                  </div>
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: stage.color }}
                  >
                    {stage.phase} — {stage.title}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 text-white">{stage.subtitle}</h3>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{stage.desc}</p>

                {/* AI tools tags */}
                <div className="flex flex-wrap gap-1.5">
                  {stage.tools.map((tool) => (
                    <span
                      key={tool}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-500"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Equity alignment CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 text-center"
        >
          <div className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl border border-[#F24822]/20 bg-[#F24822]/[0.04] backdrop-blur-sm">
            <span className="text-xl">🤝</span>
            <p className="text-base text-gray-300">
              <span className="text-white font-bold">We take equity, not just fees.</span>{' '}
              Our incentives are perfectly aligned with yours.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

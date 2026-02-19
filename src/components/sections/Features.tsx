'use client'

import { motion } from 'framer-motion'
import { Zap, BarChart3, Globe, Layers, MessageSquare, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'AI Content Generation',
    description:
      'Generate on-brand content for social, ads, email, and more. Our AI learns your voice and replicates it at scale.',
    gradient: 'from-[#9B0EE5] to-[#F24822]',
  },
  {
    icon: Globe,
    title: 'Multi-Channel Publishing',
    description:
      'Schedule and publish to Instagram, TikTok, LinkedIn, Twitter, and more from a single dashboard.',
    gradient: 'from-[#F24822] to-[#F57B18]',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description:
      'Track reach, engagement, conversions, and brand sentiment across all channels with live dashboards.',
    gradient: 'from-[#9B0EE5] to-[#6B0EE5]',
  },
  {
    icon: Layers,
    title: 'Campaign Management',
    description:
      'Plan, launch, and optimize campaigns with AI-assisted targeting and creative recommendations.',
    gradient: 'from-[#F57B18] to-[#F24822]',
  },
  {
    icon: MessageSquare,
    title: 'Brand Voice AI',
    description:
      'Train a custom AI on your brand guidelines to ensure consistent messaging across every touchpoint.',
    gradient: 'from-[#9B0EE5] to-[#F57B18]',
  },
  {
    icon: TrendingUp,
    title: 'Growth Automation',
    description:
      'Automate outreach, engagement, and follow-ups to grow your audience while you sleep.',
    gradient: 'from-[#F24822] to-[#9B0EE5]',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/60 mb-6">
            Everything you need
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Your complete brand{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #9B0EE5, #F57B18)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              growth engine
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            From content creation to multi-channel distribution to deep analytics — 
            all in one platform designed for brands that move fast.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5 shadow-lg`}
                >
                  <Icon size={22} className="text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                  style={{
                    background: `radial-gradient(circle at 50% 0%, rgba(155, 14, 229, 0.08) 0%, transparent 70%)`,
                  }}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

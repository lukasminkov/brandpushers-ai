'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    step: '01',
    title: 'Connect Your Brand',
    description:
      'Upload your brand guidelines, logos, tone of voice docs, and social profiles. Our AI ingests everything to learn your identity.',
  },
  {
    step: '02',
    title: 'Generate & Schedule',
    description:
      'Use the AI content studio to generate posts, ads, and campaigns. Review, edit, and schedule for automatic publishing.',
  },
  {
    step: '03',
    title: 'Analyze & Optimize',
    description:
      'Monitor real-time performance across all channels. Let AI surface insights and recommend adjustments to maximize growth.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, #9B0EE5 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/60 mb-6">
            How it works
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Up and running in{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #F24822, #F57B18)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              minutes
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            No complex setup, no agency required. Just connect, generate, and grow.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-[#9B0EE5] via-[#F24822] to-[#F57B18] opacity-30" />

          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center mb-6 font-mono font-bold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #9B0EE5, #F24822)',
                }}
              >
                <span className="text-white text-sm">{step.step}</span>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const reasons = [
  'TikTok-first approach — we go where the attention is',
  'Proven playbook that has launched 50+ successful brands',
  'Full-service: strategy, content, ads, analytics, and community',
  'Equity partnership — we have skin in the game',
  'Dedicated team assigned to your brand',
  'Data-driven decisions, not guesswork',
  'Network of influencers and creators ready to collaborate',
  'Weekly check-ins and transparent reporting',
]

export default function WhyUs() {
  return (
    <section id="why-us" className="py-32 px-6 relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Why Choose{' '}
              <span className="bg-logo-gradient bg-clip-text text-transparent">BrandPushers</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              We&apos;re not just consultants — we&apos;re co-builders. We take equity because we believe in what we build together.
              Your success is literally our success.
            </p>
            <a href="#apply" className="inline-block px-8 py-4 bg-brand-orange text-white font-bold rounded-xl hover:scale-105 transition-transform">
              Start Your Journey
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {reasons.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 glass rounded-xl p-4"
              >
                <CheckCircle className="text-brand-orange shrink-0 mt-0.5" size={20} />
                <span className="text-gray-300">{r}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

'use client'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const reasons = [
  'Equity partnership — we only win when you win',
  'AI-native from day one: tools, workflows, and automation built in at every stage',
  'TikTok & social commerce specialists — we go where the attention and revenue is',
  'End-to-end: we stay with you from idea all the way through to exit',
  'Selective intake — we say no to most applicants so we can go all-in on the ones we pick',
  'Hands-on co-builders, not consultants — we\'re in the trenches with you',
  'Network of creators, influencers, and brand operators ready to activate',
  'Proven playbook refined across multiple brand launches and exits',
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
              Why Partner With{' '}
              <span className="bg-logo-gradient bg-clip-text text-transparent">BrandPushers</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-4">
              We&apos;re not an agency. We&apos;re not a service. We&apos;re equity partners who put our own resources, time, and expertise on the line alongside you.
            </p>
            <p className="text-gray-500 text-base mb-8">
              Because we take equity, we are ruthlessly selective about who we partner with — and relentlessly committed to those we do. If we accept you, we&apos;re all in.
            </p>
            <a
              href="https://calendly.com/brandpushers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-brand-orange text-white font-bold rounded-xl hover:scale-105 transition-transform"
            >
              Book an Intro Call
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

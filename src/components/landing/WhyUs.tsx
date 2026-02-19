'use client'
import { motion } from 'framer-motion'
import { Target, Bot, ShoppingBag, Users, Handshake, Shield } from 'lucide-react'

const reasons = [
  {
    icon: Handshake,
    title: 'Equity Aligned',
    desc: 'We invest time, resources, and expertise for equity. When you win, we win. Zero misaligned incentives.',
  },
  {
    icon: Bot,
    title: 'AI-Native',
    desc: 'Every workflow is powered by AI — from trend detection to content creation to performance optimization.',
  },
  {
    icon: ShoppingBag,
    title: 'TikTok & Social Commerce',
    desc: 'Deep expertise in TikTok Shop, viral content strategy, and social-first brand building.',
  },
  {
    icon: Target,
    title: 'Selective Intake',
    desc: 'We only partner with a handful of founders each quarter. Quality over quantity, always.',
  },
  {
    icon: Users,
    title: 'Hands-On Partnership',
    desc: 'Not a course. Not consulting. We roll up our sleeves and build alongside you every single day.',
  },
  {
    icon: Shield,
    title: 'Built for Exit',
    desc: 'From day one, every decision is made with long-term brand value and exit potential in mind.',
  },
]

export default function WhyUs() {
  return (
    <section id="why-us" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#F24822]/6 rounded-full blur-[200px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-[#F24822] mb-4 block">
            Why Us
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5">
            Not Your Typical <span className="gradient-text">Agency</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We&apos;re founder-operators, not service providers. Here&apos;s what makes BrandPushers different.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-7 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:-translate-y-1"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F24822]/10 border border-[#F24822]/20 flex items-center justify-center mb-5 group-hover:bg-[#F24822]/15 transition">
                <r.icon size={20} className="text-[#F24822]" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{r.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

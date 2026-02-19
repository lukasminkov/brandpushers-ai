'use client'
import { motion } from 'framer-motion'
import { Rocket, TrendingUp, Users, Zap, Target, BarChart3 } from 'lucide-react'

const services = [
  { icon: Rocket, title: 'Brand Strategy', desc: 'We craft your brand identity, positioning, and go-to-market strategy from the ground up.' },
  { icon: TrendingUp, title: 'TikTok Growth', desc: 'Explosive growth on TikTok with proven content strategies and viral hooks.' },
  { icon: Users, title: 'Community Building', desc: 'Build an engaged community that converts followers into loyal customers.' },
  { icon: Zap, title: 'Content Creation', desc: 'Professional content production that captures attention and drives engagement.' },
  { icon: Target, title: 'Paid Advertising', desc: 'Strategic ad campaigns that maximize ROI across all platforms.' },
  { icon: BarChart3, title: 'Analytics & Scale', desc: 'Data-driven decisions to continuously optimize and scale your brand.' },
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
            What We <span className="bg-logo-gradient bg-clip-text text-transparent">Do</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            End-to-end brand building — from idea to empire. We handle everything so you can focus on your vision.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass rounded-2xl p-8 group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-orange/20 flex items-center justify-center mb-4 group-hover:bg-brand-orange/30 transition">
                <s.icon className="text-brand-orange" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

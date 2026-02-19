'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl p-12 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f0820 0%, #1a0a2e 50%, #0f0820 100%)',
            border: '1px solid rgba(155, 14, 229, 0.2)',
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(155, 14, 229, 0.25) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(242, 72, 34, 0.15) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Ready to push your brand{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #9B0EE5, #F24822, #F57B18)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                forward?
              </span>
            </h2>
            <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of brands already using BrandPushers.ai to grow smarter. 
              Start free — no credit card required.
            </p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #9B0EE5, #F24822)',
                boxShadow: '0 0 40px rgba(155, 14, 229, 0.3)',
              }}
            >
              Get Started Free
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

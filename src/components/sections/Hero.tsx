'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #9B0EE5 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #F57B18 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-[400px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #F24822 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 mb-8"
        >
          <Sparkles size={14} className="text-[#F24822]" />
          AI-Powered Brand Growth Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight text-white mb-6"
        >
          Push Your Brand{' '}
          <br />
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(135deg, #9B0EE5 0%, #F24822 50%, #F57B18 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Further, Faster
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          BrandPushers.ai combines AI content generation, multi-channel automation, 
          and real-time analytics to help creators and businesses grow their brand 
          without burning out.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
          >
            Start Growing for Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/40"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500'].map((color, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full ${color} border-2 border-[#0a0a0f]`}
                />
              ))}
            </div>
            <span>500+ brands already growing</span>
          </div>
          <span className="hidden sm:block text-white/20">•</span>
          <span>No credit card required</span>
          <span className="hidden sm:block text-white/20">•</span>
          <span>Cancel anytime</span>
        </motion.div>
      </div>
    </section>
  )
}

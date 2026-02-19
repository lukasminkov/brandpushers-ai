'use client'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-[128px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/20 rounded-full blur-[128px] animate-float" style={{ animationDelay: '3s' }} />
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block mb-6 px-4 py-2 rounded-full glass text-sm text-gray-300">
            🚀 Brand Accelerator &amp; Equity Partner
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6"
        >
          WE DON&apos;T BUILD BRANDS{' '}
          <span className="bg-logo-gradient bg-clip-text text-transparent">FOR YOU.</span>
          <br />
          WE BUILD THEM{' '}
          <span className="bg-logo-gradient bg-clip-text text-transparent">WITH YOU.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-400 mb-4 max-w-3xl mx-auto"
        >
          BrandPushers is a brand accelerator that takes an equity stake in your company and goes all-in alongside you — from first idea to profitable exit.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-base md:text-lg text-gray-500 mb-10 max-w-2xl mx-auto"
        >
          TikTok-first. AI-powered. Founder-aligned. We only win when you win.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="https://calendly.com/brandpushers"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-brand-orange text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform animate-pulse-glow"
          >
            Book an Intro Call
          </a>
          <a
            href="#what-we-do"
            className="px-8 py-4 glass text-white font-bold rounded-xl text-lg hover:bg-white/10 transition"
          >
            See How It Works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-6 text-sm text-gray-600"
        >
          Selective intake — we partner with a limited number of founders each quarter.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: 'Idea', label: 'Where You Start' },
            { value: '→', label: 'The Journey' },
            { value: 'Exit', label: 'Where We Aim' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black bg-logo-gradient bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

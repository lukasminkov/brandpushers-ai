'use client'
import { motion } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
})

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-32 pb-24">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-[#9B0EE5]/15 rounded-full blur-[160px] animate-float" />
        <div className="absolute top-[30%] right-[15%] w-[400px] h-[400px] bg-[#F24822]/12 rounded-full blur-[140px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[10%] left-[40%] w-[300px] h-[300px] bg-[#F57B18]/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0f_70%)]" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Badge */}
        <motion.div {...fadeUp(0)}>
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm text-sm text-gray-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#F24822] animate-pulse" />
            Brand Accelerator &amp; Equity Partner
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.15)}
          className="text-[2.75rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tight mb-7"
        >
          From Zero to{' '}
          <span className="gradient-text">Exit.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.3)}
          className="text-xl md:text-2xl text-gray-300 mb-3 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          We take equity and build your brand alongside you — not for you.
        </motion.p>

        <motion.p
          {...fadeUp(0.4)}
          className="text-base text-gray-500 mb-10 max-w-xl mx-auto"
        >
          AI-powered operations. TikTok-first distribution. Aligned incentives from day one.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.5)}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-5"
        >
          <a
            href="#apply"
            className="group relative px-8 py-4 gradient-bg text-white font-bold rounded-xl text-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(242,72,34,0.4)]"
          >
            Apply Now
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </a>
          <a
            href="#journey"
            className="px-8 py-4 rounded-xl text-lg font-bold text-white border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
          >
            How It Works
          </a>
        </motion.div>

        <motion.p
          {...fadeUp(0.6)}
          className="text-sm text-gray-600"
        >
          Selective intake — limited spots each quarter
        </motion.p>
      </div>
    </section>
  )
}

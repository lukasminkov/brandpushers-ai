'use client'
import { motion } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
})

const stages = [
  { label: 'Idea', desc: 'Validate & refine', color: '#9B0EE5' },
  { label: 'Launch', desc: 'Build & go live', color: '#C03A8E' },
  { label: 'Scale', desc: 'AI + TikTok growth', color: '#F24822' },
  { label: 'Exit', desc: 'Cash out together', color: '#F57B18' },
]

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-32 pb-20">
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

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
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
          <br />
          <span className="text-gray-400 text-[0.65em]">We build it with you.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.3)}
          className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          We take equity, embed AI into your operations, and go all-in alongside you. TikTok-first. Founder-aligned. No exits without you.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.45)}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-4"
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
            See How It Works
          </a>
        </motion.div>

        <motion.p
          {...fadeUp(0.55)}
          className="text-sm text-gray-600 mb-20"
        >
          Selective intake — limited spots each quarter
        </motion.p>

        {/* Journey — sleek pipeline visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
          className="relative max-w-3xl mx-auto"
        >
          {/* The pipeline track */}
          <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-1 overflow-hidden">
            {/* Animated gradient sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#9B0EE5]/0 via-[#F24822]/5 to-[#F57B18]/0 animate-[shimmer_3s_ease-in-out_infinite]" />
            
            <div className="relative grid grid-cols-4 gap-0">
              {stages.map((stage, i) => (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
                  className="group relative flex flex-col items-center py-6 px-2 sm:px-4"
                >
                  {/* Glow dot */}
                  <div className="relative mb-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: stage.color,
                        boxShadow: `0 0 20px ${stage.color}60, 0 0 40px ${stage.color}30`
                      }}
                    />
                    {/* Pulse ring */}
                    <div 
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: stage.color, animationDuration: `${2 + i * 0.5}s` }}
                    />
                  </div>

                  {/* Connecting line to next */}
                  {i < stages.length - 1 && (
                    <div 
                      className="absolute top-[2.15rem] left-[60%] w-[80%] h-px hidden sm:block"
                      style={{
                        background: `linear-gradient(to right, ${stage.color}40, ${stages[i + 1].color}40)`
                      }}
                    />
                  )}

                  <span className="text-sm sm:text-base font-bold text-white mb-1">{stage.label}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 leading-tight">{stage.desc}</span>
                </motion.div>
              ))}
            </div>

            {/* Bottom gradient bar showing progression */}
            <div className="h-[2px] bg-gradient-to-r from-[#9B0EE5] via-[#F24822] to-[#F57B18] opacity-60 rounded-b-full" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

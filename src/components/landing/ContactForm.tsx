'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const steps = ['About You', 'Your Vision', 'Apply']

export default function ContactForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', brandName: '', category: '', stage: '', about: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-[#F24822]/40 focus:ring-1 focus:ring-[#F24822]/20 transition text-sm'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2'

  const canNext = step === 0
    ? form.name && form.email
    : step === 1
      ? form.category && form.stage
      : true

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()

      // 1. Send magic link — this creates/signs in the user
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: form.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: form.name,
          },
        },
      })

      if (otpError) {
        setError(otpError.message)
        setLoading(false)
        return
      }

      // 2. Save application data server-side (service role, no auth required)
      await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          brandName: form.brandName,
          category: form.category,
          stage: form.stage,
          about: form.about,
        }),
      })

      // 3. Show confirmation — magic link is on its way
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="apply" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#9B0EE5]/6 rounded-full blur-[180px]" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-[#F24822] mb-4 block">
            Apply Now
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Think You Have What{' '}
            <span className="gradient-text">It Takes?</span>
          </h2>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            We partner with a handful of founders each quarter. Applications are reviewed within 48 hours.
          </p>
        </motion.div>

        {/* Scarcity badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F24822]/10 border border-[#F24822]/20">
            <Lock size={14} className="text-[#F24822]" />
            <span className="text-xs font-medium text-[#F24822]">Only 5 spots remaining this quarter</span>
          </div>
        </div>

        {/* Progress */}
        {!submitted && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i <= step ? 'gradient-bg text-white' : 'bg-white/[0.06] text-gray-500 border border-white/[0.08]'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${i <= step ? 'text-white' : 'text-gray-500'}`}>{s}</span>
                {i < steps.length - 1 && <div className="w-8 h-px bg-white/[0.1] mx-1" />}
              </div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-8"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              {/* Email icon with glow */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#9B0EE5]/10 border border-[#9B0EE5]/20 mb-6">
                <Mail size={36} className="text-[#9B0EE5]" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Check Your Inbox</h3>
              <p className="text-gray-400 mb-2 max-w-sm mx-auto">
                We sent a magic link to{' '}
                <span className="text-white font-semibold">{form.email}</span>.
              </p>
              <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
                Click the link to confirm your application and access your member dashboard. It expires in 10 minutes.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-gray-400">
                <Lock size={12} className="text-[#F24822]" />
                Your application is under review — we&apos;ll be in touch within 48 hours.
              </div>
              <p className="text-gray-600 text-xs mt-6">
                Didn&apos;t get an email?{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-gray-400 hover:text-white underline transition"
                >
                  Try again
                </button>
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input className={inputClass} placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input className={inputClass} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Brand or Idea Name</label>
                      <input className={inputClass} placeholder="What are you building? (optional)" value={form.brandName} onChange={e => set('brandName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>What space are you in? *</label>
                      <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
                        <option value="">Select a category</option>
                        <option>Beauty &amp; Skincare</option>
                        <option>Fashion &amp; Apparel</option>
                        <option>Health &amp; Wellness</option>
                        <option>Food &amp; Beverage</option>
                        <option>Home &amp; Lifestyle</option>
                        <option>Tech &amp; Gadgets</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Where are you right now? *</label>
                      <select className={inputClass} value={form.stage} onChange={e => set('stage', e.target.value)}>
                        <option value="">Select your stage</option>
                        <option>Just an idea — haven&apos;t started yet</option>
                        <option>Have a product, no sales yet</option>
                        <option>Early traction (&lt; $10k/mo)</option>
                        <option>Growing ($10k-$100k/mo)</option>
                        <option>Scaling ($100k+/mo)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Why should we bet on you?</label>
                      <textarea className={inputClass + ' h-24 resize-none'} placeholder="What makes you and your vision different?" value={form.about} onChange={e => set('about', e.target.value)} />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="text-center py-6">
                    <p className="text-gray-300 text-lg mb-2">
                      You&apos;re almost in.
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      We&apos;ll send a magic link to <span className="text-white font-medium">{form.email}</span> to confirm your application. No password required.
                    </p>
                    {error && (
                      <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2 mb-4">
                        {error}
                      </p>
                    )}
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-8 py-4 gradient-bg text-white font-bold rounded-xl text-lg hover:shadow-[0_0_30px_rgba(242,72,34,0.4)] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending link...
                        </>
                      ) : (
                        <>Submit Application <ArrowRight size={20} /></>
                      )}
                    </button>
                    <p className="text-gray-600 text-xs mt-4">By applying, you agree to our <a href="/terms" className="underline hover:text-gray-400">Terms</a> and <a href="/privacy" className="underline hover:text-gray-400">Privacy Policy</a></p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {!submitted && step < 2 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-1 px-6 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(242,72,34,0.3)] transition-all"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Subtle "already applied" link */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Already applied?{' '}
          <a href="/login" className="text-gray-400 hover:text-white underline transition">
            Sign in to check your status
          </a>
        </p>
      </div>
    </section>
  )
}

'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, CheckCircle, Lock } from 'lucide-react'

const steps = ['About You', 'Your Vision', 'Apply']

export default function ContactForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', brandName: '', category: '', stage: '', revenue: '', website: '', about: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-[#F24822]/40 focus:ring-1 focus:ring-[#F24822]/20 transition text-sm'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2'

  const canNext = step === 0
    ? form.name && form.email
    : step === 1
      ? form.category && form.stage
      : true

  const handleSubmit = async () => {
    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.from('applications').insert({
        name: form.name,
        answers: {
          email: form.email,
          brandName: form.brandName,
          category: form.category,
          stage: form.stage,
          about: form.about,
        },
        status: 'pending',
      })
    } catch (e) {
      // best-effort
    }
    setSubmitted(true)
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-8"
        >
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Application Received</h3>
              <p className="text-gray-400 mb-6">We review every application personally. If you&apos;re a fit, we&apos;ll reach out within 48 hours to schedule your intro call.</p>
              <p className="text-gray-500 text-sm">Not everyone gets in — but those who do, build something extraordinary.</p>
            </div>
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
                        <option>Beauty & Skincare</option>
                        <option>Fashion & Apparel</option>
                        <option>Health & Wellness</option>
                        <option>Food & Beverage</option>
                        <option>Home & Lifestyle</option>
                        <option>Tech & Gadgets</option>
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
                    <p className="text-gray-500 text-sm mb-8">
                      Submit your application and our team will review it. Selected founders will be invited to an intro call.
                    </p>
                    <button
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 px-8 py-4 gradient-bg text-white font-bold rounded-xl text-lg hover:shadow-[0_0_30px_rgba(242,72,34,0.4)] transition-all hover:scale-[1.02]"
                    >
                      Submit Application <ArrowRight size={20} />
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
      </div>
    </section>
  )
}

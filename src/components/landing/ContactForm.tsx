'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

const steps = ['Basics', 'Your Brand', 'Book a Call']

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
      ? form.brandName && form.category
      : true

  return (
    <section id="contact" className="relative py-28 px-6 overflow-hidden">
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
            Get Started
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Ready to Build Something{' '}
            <span className="gradient-text">Extraordinary?</span>
          </h2>
          <p className="text-gray-400 text-base">
            Tell us about your brand and we&apos;ll set up an intro call to see if we&apos;re a fit.
          </p>
        </motion.div>

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
              <h3 className="text-2xl font-bold mb-2">We&apos;ll Be in Touch!</h3>
              <p className="text-gray-400">Check your email for next steps and a link to book your call.</p>
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
                      <label className={labelClass}>Your Name *</label>
                      <input className={inputClass} placeholder="Jane Doe" value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input className={inputClass} type="email" placeholder="jane@brand.com" value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Brand Name *</label>
                      <input className={inputClass} placeholder="Your brand or idea name" value={form.brandName} onChange={e => set('brandName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Category *</label>
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
                      <label className={labelClass}>Current Stage</label>
                      <select className={inputClass} value={form.stage} onChange={e => set('stage', e.target.value)}>
                        <option value="">Where are you now?</option>
                        <option>Just an idea</option>
                        <option>Have a product, no sales yet</option>
                        <option>Early sales (&lt; $10k/mo)</option>
                        <option>Growing ($10k-$100k/mo)</option>
                        <option>Scaling ($100k+/mo)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Tell us about your vision</label>
                      <textarea className={inputClass + ' h-24 resize-none'} placeholder="What makes your brand unique?" value={form.about} onChange={e => set('about', e.target.value)} />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="text-center py-6">
                    <p className="text-gray-300 text-lg mb-6">
                      Great! Let&apos;s get on a call and explore if we&apos;re a fit.
                    </p>
                    <a
                      href="https://calendly.com/brandpushers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 gradient-bg text-white font-bold rounded-xl text-lg hover:shadow-[0_0_30px_rgba(242,72,34,0.4)] transition-all"
                    >
                      Book Your Intro Call <ArrowRight size={20} />
                    </a>
                    <p className="text-gray-500 text-sm mt-4">15 min · No commitment · Free</p>
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

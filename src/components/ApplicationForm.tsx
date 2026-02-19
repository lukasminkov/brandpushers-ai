'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, ArrowLeft, Calendar, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const steps = [
  { title: 'About You', fields: ['name', 'email'] },
  { title: 'Your Brand Idea', fields: ['brandName', 'brandStage', 'description'] },
]

export default function ApplicationForm() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', brandName: '', brandStage: 'idea', description: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setLoading(true)
    try {
      // Save lead info to Supabase (best-effort, no account creation)
      const supabase = createClient()
      await supabase.from('applications').insert({
        name: form.brandName || form.name,
        brand_stage: form.brandStage,
        answers: {
          description: form.description,
          applicant_name: form.name,
          applicant_email: form.email,
        },
        status: 'pending',
      })
    } catch {
      // Silently continue — we still want to redirect to booking
    } finally {
      setLoading(false)
      setDone(true)
    }
  }

  if (done) {
    return (
      <section id="apply" className="py-32 px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg mx-auto text-center glass rounded-2xl p-12">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
          <h3 className="text-2xl font-bold mb-2">Thanks, {form.name.split(' ')[0]}!</h3>
          <p className="text-gray-400 mb-8">
            We&apos;ve received your details. The next step is to book your 30-minute intro call — we&apos;ll learn more about your brand idea and see if we&apos;re a good fit.
          </p>
          <a
            href="https://calendly.com/brandpushers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-brand-orange text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform animate-pulse-glow"
          >
            <Calendar size={20} />
            Book Your Intro Call
          </a>
        </motion.div>
      </section>
    )
  }

  return (
    <section id="apply" className="py-32 px-6 relative">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Book an <span className="bg-logo-gradient bg-clip-text text-transparent">Intro Call</span>
          </h2>
          <p className="text-gray-400 text-lg">Tell us a little about yourself and your brand idea. Then we&apos;ll get on a call to see if we&apos;re the right fit for each other.</p>
          <p className="text-sm text-gray-600 mt-2">We review every submission personally — no automated rejections.</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${i <= step ? 'bg-brand-orange' : 'bg-dark-600 text-gray-500'}`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-brand-orange' : 'bg-dark-600'}`} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-6">{steps[step].title}</h3>
          
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {step === 0 && <>
                <input
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
                <input
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition"
                  placeholder="Email Address"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </>}
              {step === 1 && <>
                <input
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition"
                  placeholder="Brand Name (or working title)"
                  value={form.brandName}
                  onChange={e => set('brandName', e.target.value)}
                />
                <select
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition"
                  value={form.brandStage}
                  onChange={e => set('brandStage', e.target.value)}
                >
                  <option value="idea">Just an idea — haven&apos;t started yet</option>
                  <option value="early">Early stage — some progress made</option>
                  <option value="launched">Already launched — looking to scale</option>
                  <option value="scaling">Scaling — need to accelerate growth</option>
                </select>
                <textarea
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition h-32 resize-none"
                  placeholder="Tell us about your brand idea — what is it, who's it for, and why now?"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
              </>}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-6 py-3 glass rounded-xl disabled:opacity-30 hover:bg-white/10 transition"
            >
              <ArrowLeft size={16} /> Back
            </button>
            {step < 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!form.name || !form.email}
                className="flex items-center gap-2 px-6 py-3 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading || !form.description}
                className="flex items-center gap-2 px-6 py-3 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : <><Calendar size={16} /> Book My Call</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const steps = [
  { title: 'About You', fields: ['name', 'email', 'password'] },
  { title: 'Your Brand', fields: ['brandName', 'brandStage'] },
  { title: 'Details', fields: ['description', 'goals'] },
]

export default function ApplicationForm() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', brandName: '', brandStage: 'idea',
    description: '', goals: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      // Sign up user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } }
      })
      if (authErr) throw authErr

      // Create application
      if (authData.user) {
        await supabase.from('applications').insert({
          user_id: authData.user.id,
          name: form.brandName,
          brand_stage: form.brandStage,
          answers: { description: form.description, goals: form.goals, applicant_name: form.name },
          status: 'pending',
        })
      }
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <section id="apply" className="py-32 px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg mx-auto text-center glass rounded-2xl p-12">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
          <h3 className="text-2xl font-bold mb-2">Application Submitted!</h3>
          <p className="text-gray-400">We&apos;ll review your application and get back to you soon. Check your email to verify your account.</p>
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
            Ready to <span className="bg-logo-gradient bg-clip-text text-transparent">Apply</span>?
          </h2>
          <p className="text-gray-400 text-lg">Tell us about yourself and your brand idea. It only takes 2 minutes.</p>
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
                <input className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition" placeholder="Full Name" value={form.name} onChange={e => set('name', e.target.value)} />
                <input className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition" placeholder="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                <input className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition" placeholder="Password (min 6 chars)" type="password" value={form.password} onChange={e => set('password', e.target.value)} />
              </>}
              {step === 1 && <>
                <input className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition" placeholder="Brand Name" value={form.brandName} onChange={e => set('brandName', e.target.value)} />
                <select className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition" value={form.brandStage} onChange={e => set('brandStage', e.target.value)}>
                  <option value="idea">Just an idea</option>
                  <option value="early">Early stage (some progress)</option>
                  <option value="launched">Already launched</option>
                  <option value="scaling">Scaling up</option>
                </select>
              </>}
              {step === 2 && <>
                <textarea className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition h-28 resize-none" placeholder="Describe your brand idea..." value={form.description} onChange={e => set('description', e.target.value)} />
                <textarea className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition h-28 resize-none" placeholder="What are your goals for the next 6 months?" value={form.goals} onChange={e => set('goals', e.target.value)} />
              </>}
            </motion.div>
          </AnimatePresence>

          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="flex items-center gap-2 px-6 py-3 glass rounded-xl disabled:opacity-30 hover:bg-white/10 transition">
              <ArrowLeft size={16} /> Back
            </button>
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-6 py-3 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
                {loading ? 'Submitting...' : <>Submit <Send size={16} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

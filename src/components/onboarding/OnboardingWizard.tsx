'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Building2, CheckCircle, ChevronRight, ChevronLeft,
  MapPin, Calendar, Sparkles, Rocket, Star
} from 'lucide-react'

interface OnboardingWizardProps {
  userId: string
  initialFullName?: string
  onComplete: () => void
}

interface PersonalInfo {
  full_name: string
  date_of_birth: string
  street: string
  city: string
  state: string
  country: string
  postal_code: string
}

interface BrandInfo {
  brand_name: string
  brand_description: string
}

const steps = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Brand Info', icon: Building2 },
  { id: 3, label: 'Confirmation', icon: CheckCircle },
]

export default function OnboardingWizard({ userId, initialFullName = '', onComplete }: OnboardingWizardProps) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [personal, setPersonal] = useState<PersonalInfo>({
    full_name: initialFullName,
    date_of_birth: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  })

  const [brand, setBrand] = useState<BrandInfo>({
    brand_name: '',
    brand_description: '',
  })

  const updatePersonal = (field: keyof PersonalInfo, value: string) => {
    setPersonal(prev => ({ ...prev, [field]: value }))
  }

  const updateBrand = (field: keyof BrandInfo, value: string) => {
    setBrand(prev => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!personal.full_name.trim()) return 'Full name is required'
    if (!personal.date_of_birth) return 'Date of birth is required'
    if (!personal.street.trim()) return 'Street address is required'
    if (!personal.city.trim()) return 'City is required'
    if (!personal.country.trim()) return 'Country is required'
    return ''
  }

  const validateStep2 = () => {
    if (!brand.brand_name.trim()) return 'Brand / Company name is required'
    return ''
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(s => s - 1)
  }

  const handleComplete = async () => {
    setSaving(true)
    setError('')

    const addressParts = [
      personal.street,
      personal.city,
      personal.state,
      personal.country,
      personal.postal_code,
    ].filter(Boolean)
    const residential_address = addressParts.join(', ')

    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: personal.full_name,
        date_of_birth: personal.date_of_birth || null,
        residential_address: residential_address || null,
        brand_name: brand.brand_name || null,
        onboarding_completed: true,
      })
      .eq('id', userId)

    if (err) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    onComplete()
  }

  const formattedAddress = [
    personal.street,
    personal.city,
    personal.state,
    personal.country,
    personal.postal_code,
  ].filter(Boolean).join(', ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(20px)' }}>
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #9B0EE5, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F24822, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
          >
            <Rocket size={28} className="text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Welcome to BrandPushers! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-gray-400"
          >
            You&apos;ve been accepted. Let&apos;s set up your profile to get started.
          </motion.p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : isDone
                    ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                    : 'text-gray-600 bg-white/5 border border-white/5'
                }`} style={isActive ? { background: 'linear-gradient(135deg, #9B0EE5, #F24822)', border: 'none' } : {}}>
                  <Icon size={12} />
                  <span className="hidden sm:block">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-px transition-colors duration-300 ${isDone ? 'bg-green-500/50' : 'bg-white/10'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(155,14,229,0.2)', border: '1px solid rgba(155,14,229,0.3)' }}>
                    <User size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Personal Information</h2>
                    <p className="text-xs text-gray-500">Tell us a bit about yourself</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={personal.full_name}
                    onChange={e => updatePersonal('full_name', e.target.value)}
                    placeholder="Your full legal name"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                    <Calendar size={11} /> Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={personal.date_of_birth}
                    onChange={e => updatePersonal('date_of_birth', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all focus:border-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                    <MapPin size={11} /> Residential Address *
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={personal.street}
                      onChange={e => updatePersonal('street', e.target.value)}
                      placeholder="Street address"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={personal.city}
                        onChange={e => updatePersonal('city', e.target.value)}
                        placeholder="City *"
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <input
                        type="text"
                        value={personal.state}
                        onChange={e => updatePersonal('state', e.target.value)}
                        placeholder="State / Province"
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={personal.country}
                        onChange={e => updatePersonal('country', e.target.value)}
                        placeholder="Country *"
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <input
                        type="text"
                        value={personal.postal_code}
                        onChange={e => updatePersonal('postal_code', e.target.value)}
                        placeholder="Postal Code"
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Brand Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242,72,34,0.2)', border: '1px solid rgba(242,72,34,0.3)' }}>
                    <Building2 size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Brand Information</h2>
                    <p className="text-xs text-gray-500">Tell us about your brand or company</p>
                  </div>
                </div>

                {/* Excitement callout */}
                <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(155,14,229,0.1)', border: '1px solid rgba(155,14,229,0.2)' }}>
                  <Sparkles size={16} className="text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-300">
                    This is where your journey begins. Your brand is about to grow with BrandPushers as your equity partner.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Brand / Company Name *</label>
                  <input
                    type="text"
                    value={brand.brand_name}
                    onChange={e => updateBrand('brand_name', e.target.value)}
                    placeholder="e.g. Glow Cosmetics LLC"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                    Brand Description <span className="text-gray-600">(optional)</span>
                  </label>
                  <textarea
                    value={brand.brand_description}
                    onChange={e => updateBrand('brand_description', e.target.value)}
                    placeholder="What does your brand do? What makes it unique?"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Almost there! Review your info</h2>
                    <p className="text-xs text-gray-500">Everything look good?</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Personal summary */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <User size={10} /> Personal
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name</span>
                        <span className="text-white font-medium">{personal.full_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date of Birth</span>
                        <span className="text-white">{personal.date_of_birth ? new Date(personal.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 shrink-0">Address</span>
                        <span className="text-white text-right">{formattedAddress || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Brand summary */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Building2 size={10} /> Brand
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Brand Name</span>
                        <span className="text-white font-medium" style={{ color: '#F24822' }}>{brand.brand_name || '—'}</span>
                      </div>
                      {brand.brand_description && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500 shrink-0">Description</span>
                          <span className="text-gray-300 text-right text-xs">{brand.brand_description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Launch message */}
                  <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(155,14,229,0.1), rgba(242,72,34,0.1))', border: '1px solid rgba(155,14,229,0.2)' }}>
                    <Star size={20} className="mx-auto mb-2" style={{ color: '#F57B18' }} />
                    <p className="text-sm text-gray-300">
                      You&apos;re about to join an elite group of brand builders.<br />
                      <span className="text-white font-medium">Welcome to the family!</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="px-6 pb-2">
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Rocket size={16} /> Start Your Journey
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

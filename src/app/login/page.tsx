'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(155, 14, 229, 0.10) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(242, 72, 34, 0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9B0EE5] to-[#F24822] flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-white">
              BrandPushers<span className="text-[#F24822]">.ai</span>
            </span>
          </div>

          {!sent ? (
            <>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-gray-400 mb-4">
                  <Clock size={11} className="text-[#F24822]" />
                  Members &amp; applicants only
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Already Applied?
                </h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  Enter your email to receive a magic link. Check on your application status, or — if you&apos;ve been approved — access your member dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 bg-white/5 border border-white/10 focus:border-[#9B0EE5]/50 focus:outline-none focus:ring-2 focus:ring-[#9B0EE5]/20 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #9B0EE5, #F24822)',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>

              {/* Divider + apply CTA */}
              <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                <p className="text-xs text-white/30">
                  Haven&apos;t applied yet?{' '}
                  <Link href="/#apply" className="text-white/50 hover:text-white/80 underline transition">
                    Apply for a spot
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                We sent a magic link to{' '}
                <span className="text-white font-medium">{email}</span>.{' '}
                Click it to sign in — link expires in 10 minutes.
              </p>
              <p className="text-xs text-white/30">
                You&apos;ll be redirected based on your application status automatically.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-white/40 hover:text-white/70 transition-colors underline"
              >
                Resend or use a different email
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

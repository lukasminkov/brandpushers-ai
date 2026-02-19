'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'For solo creators and small brands just getting started.',
    features: [
      '5 connected channels',
      '100 AI content generations/mo',
      'Basic analytics dashboard',
      'Content scheduling',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$149',
    period: '/mo',
    description: 'For growing brands that need more power and automation.',
    features: [
      'Unlimited channels',
      'Unlimited AI generations',
      'Advanced analytics & reports',
      'Campaign management',
      'Brand voice training',
      'Priority support',
      'Team collaboration (5 seats)',
    ],
    cta: 'Start Growing',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '$499',
    period: '/mo',
    description: 'For agencies managing multiple brands at scale.',
    features: [
      'Everything in Growth',
      'Unlimited workspaces',
      'White-label reports',
      'API access',
      'Dedicated account manager',
      'Custom AI training',
      'SLA guarantee',
    ],
    cta: 'Talk to Sales',
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/60 mb-6">
            Simple pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Invest in your brand&apos;s{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #9B0EE5, #F57B18)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              growth
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            No hidden fees, no long-term contracts. Start free, scale as you grow.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-[#1a1228] to-[#120c1f] border-2 border-[#9B0EE5]/50'
                  : 'bg-white/[0.03] border border-white/[0.06]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div
                    className="px-4 py-1 rounded-full text-xs font-semibold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #9B0EE5, #F24822)',
                    }}
                  >
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <div className="text-sm font-medium text-white/60 mb-2">{plan.name}</div>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 mb-1">{plan.period}</span>
                </div>
                <p className="text-sm text-white/50">{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
                    <Check
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-[#9B0EE5]' : 'text-[#F24822]'}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`block text-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  plan.highlighted
                    ? 'text-white hover:opacity-90'
                    : 'text-white border border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
                style={
                  plan.highlighted
                    ? { background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }
                    : {}
                }
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

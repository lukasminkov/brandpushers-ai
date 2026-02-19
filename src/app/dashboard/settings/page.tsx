'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, CreditCard, Plug } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'security', label: 'Security', icon: Shield },
]

const integrations = [
  { name: 'Instagram', description: 'Post content and read analytics', connected: true },
  { name: 'TikTok', description: 'Publish videos and track performance', connected: true },
  { name: 'LinkedIn', description: 'Post articles and company updates', connected: false },
  { name: 'Twitter / X', description: 'Publish tweets and monitor mentions', connected: false },
  { name: 'Mailchimp', description: 'Sync audiences and run email campaigns', connected: false },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-white/40 text-sm">Manage your account and preferences.</p>
      </motion.div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-48 flex-shrink-0"
        >
          <div className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeTab === id
                    ? 'bg-[#F24822]/10 text-[#F24822]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {activeTab === 'profile' && (
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-5">
              <h2 className="text-base font-semibold text-white">Profile Information</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9B0EE5] to-[#F24822] flex items-center justify-center text-xl font-bold text-white">
                  U
                </div>
                <button className="text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
                  Upload Photo
                </button>
              </div>
              {[
                { label: 'Brand Name', placeholder: 'Your Brand' },
                { label: 'Email', placeholder: 'you@example.com' },
                { label: 'Website', placeholder: 'https://yourbrand.com' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs text-white/50 mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-white/[0.05] border border-white/[0.06] focus:border-[#9B0EE5]/50 focus:outline-none focus:ring-2 focus:ring-[#9B0EE5]/20 placeholder-white/20 transition-all"
                  />
                </div>
              ))}
              <button
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}
              >
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h2 className="text-base font-semibold text-white mb-5">Connected Channels</h2>
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.1] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{integration.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{integration.description}</p>
                    </div>
                    <button
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                        integration.connected
                          ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20'
                          : 'text-white bg-white/[0.08] hover:bg-white/[0.12]'
                      }`}
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h2 className="text-base font-semibold text-white mb-5">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Campaign performance alerts', desc: 'Get notified when a campaign hits milestones' },
                  { label: 'Weekly digest', desc: 'Summary of your brand metrics every Monday' },
                  { label: 'AI content ready', desc: 'When AI finishes generating your content batches' },
                  { label: 'Security alerts', desc: 'Login attempts and account changes' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-white">{item.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                      <div className="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-[#F24822] transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'billing' || activeTab === 'security') && (
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center py-12">
              <p className="text-white/30 text-sm">
                {activeTab === 'billing' ? '💳 Billing management coming soon.' : '🔐 Security settings coming soon.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

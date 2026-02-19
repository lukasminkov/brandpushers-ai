'use client'

import { motion } from 'framer-motion'

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-[var(--text-secondary)] mb-8">Manage your account and preferences.</p>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-8">
        <p className="text-[var(--text-secondary)]">
          Account settings and preferences will be available here soon.
        </p>
      </div>
    </motion.div>
  )
}

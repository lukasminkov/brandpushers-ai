'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 w-full z-50 glass"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="BrandPushers" width={36} height={36} />
          <span className="text-xl font-bold bg-logo-gradient bg-clip-text text-transparent">BrandPushers</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#what-we-do" className="text-gray-300 hover:text-white transition">The Journey</a>
          <a href="#why-us" className="text-gray-300 hover:text-white transition">Why Us</a>
          <a href="#apply" className="text-gray-300 hover:text-white transition">Get in Touch</a>
          <a
            href="https://calendly.com/brandpushers"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-brand-orange rounded-lg font-semibold hover:opacity-90 transition"
          >
            Book a Call
          </a>
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden px-6 pb-4 flex flex-col gap-4">
          <a href="#what-we-do" className="text-gray-300" onClick={() => setOpen(false)}>The Journey</a>
          <a href="#why-us" className="text-gray-300" onClick={() => setOpen(false)}>Why Us</a>
          <a href="#apply" className="text-gray-300" onClick={() => setOpen(false)}>Get in Touch</a>
          <a
            href="https://calendly.com/brandpushers"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-brand-orange rounded-lg font-semibold text-center"
            onClick={() => setOpen(false)}
          >
            Book a Call
          </a>
        </motion.div>
      )}
    </motion.nav>
  )
}

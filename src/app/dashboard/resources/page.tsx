'use client'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function ResourcesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-orange/20 flex items-center justify-center mb-4">
        <BookOpen size={24} className="text-brand-orange" />
      </div>
      <h2 className="text-xl font-bold mb-2">Resources Are Inside Your Phases</h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        Resources and materials are now attached directly to each step in your program phases. Click any step to access them.
      </p>
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition">
        View My Program <ArrowRight size={16} />
      </Link>
    </div>
  )
}

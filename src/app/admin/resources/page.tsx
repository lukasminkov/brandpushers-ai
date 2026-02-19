'use client'
import Link from 'next/link'
import { Layers, ArrowRight } from 'lucide-react'

export default function ResourcesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-orange/20 flex items-center justify-center mb-4">
        <Layers size={24} className="text-brand-orange" />
      </div>
      <h2 className="text-xl font-bold mb-2">Resources Moved</h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        Resources are now managed as part of Phase Steps. Add resource links directly to each step in the Phases builder.
      </p>
      <Link href="/admin/phases" className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition">
        Go to Phases Builder <ArrowRight size={16} />
      </Link>
    </div>
  )
}

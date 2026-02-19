'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink } from 'lucide-react'

interface Resource { id: string; title: string; description: string; url: string; category: string }

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
      setResources((data || []) as Resource[])
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Resources</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {resources.map(r => (
          <a key={r.id} href={r.url} target="_blank" className="glass rounded-xl p-5 hover:bg-white/10 transition group">
            <span className="text-xs px-2 py-1 rounded-full bg-brand-orange/20 text-brand-orange">{r.category}</span>
            <h4 className="font-semibold mt-2 group-hover:text-brand-orange transition flex items-center gap-2">
              {r.title} <ExternalLink size={14} />
            </h4>
            {r.description && <p className="text-gray-500 text-sm mt-1">{r.description}</p>}
          </a>
        ))}
        {resources.length === 0 && <div className="col-span-2 text-center text-gray-500 py-12">No resources available yet.</div>}
      </div>
    </div>
  )
}

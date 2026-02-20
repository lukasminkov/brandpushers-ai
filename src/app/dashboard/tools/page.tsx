'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, ExternalLink, Wrench } from 'lucide-react'

interface Tool {
  id: string
  name: string
  description: string | null
  category: string
  banner_url: string | null
  icon_url: string | null
  link: string | null
  badge: string | null
  badge_color: string
  sort_order: number
}

// Internal tool routes - tools with these names route internally instead of external links
const INTERNAL_TOOLS: Record<string, string> = {
  'The Bible': '/dashboard/tools/bible',
  'Unit Economics Calculator': '/dashboard/tools/uecalculator',
}

export default function MemberToolsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('tools').select('*').eq('visible', true).order('category').order('sort_order')
      setTools((data || []) as Tool[])
      setLoading(false)
    })()
  }, [])

  const filtered = search
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    : tools

  const grouped = filtered.reduce<Record<string, Tool[]>>((acc, t) => {
    ;(acc[t.category] ||= []).push(t)
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tools</h1>
        <p className="text-sm text-gray-500 mt-1">Resources and tools to help grow your brand</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tools…"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F24822]/50 transition"
        />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Wrench size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-500">{search ? 'No tools match your search' : 'No tools available yet'}</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(t => {
                const normalizedLink = t.link?.startsWith('/') ? t.link : t.link ? `/dashboard/tools/${t.link}` : null
                const internalRoute = INTERNAL_TOOLS[t.name] || (normalizedLink?.startsWith('/dashboard/tools/') ? normalizedLink : null)
                const handleClick = internalRoute
                  ? (e: React.MouseEvent) => { e.preventDefault(); router.push(internalRoute) }
                  : undefined
                return (
                <a
                  key={t.id}
                  href={internalRoute || t.link || '#'}
                  target={!internalRoute && t.link ? '_blank' : undefined}
                  rel={!internalRoute && t.link ? 'noopener noreferrer' : undefined}
                  onClick={handleClick}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {/* Banner */}
                  <div className="relative h-36 overflow-hidden">
                    {t.banner_url ? (
                      <img src={t.banner_url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9B0EE5, #F24822)' }}>
                        <Wrench size={32} className="text-white/30" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)' }} />

                    {/* Badge */}
                    {t.badge && (
                      <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-semibold text-white shadow-lg" style={{ background: t.badge_color }}>
                        {t.badge}
                      </span>
                    )}

                    {/* Icon overlay */}
                    {t.icon_url && (
                      <img src={t.icon_url} alt="" className="absolute bottom-3 left-4 w-10 h-10 rounded-xl shadow-lg border-2 border-black/30 object-cover" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-white font-semibold text-sm truncate">{t.name}</h3>
                      {t.link && !internalRoute && <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400 transition shrink-0" />}
                    </div>
                    {t.description && <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{t.description}</p>}
                  </div>
                </a>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

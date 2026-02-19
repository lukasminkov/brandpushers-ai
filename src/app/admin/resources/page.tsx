'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ExternalLink } from 'lucide-react'

interface Resource { id: string; title: string; description: string; url: string; category: string }

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
    setResources((data || []) as Resource[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!title.trim() || !url.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('resources').insert({ title, description: desc, url, category, created_by: user?.id })
    setTitle(''); setUrl(''); setDesc(''); load()
  }

  const remove = async (id: string) => {
    await supabase.from('resources').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Resources</h1>
      
      <div className="glass rounded-2xl p-6 mb-8">
        <h3 className="font-bold mb-4">Add Resource</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input className="bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
          <input className="bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <select className="bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="tiktok">TikTok</option>
            <option value="branding">Branding</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
        <button onClick={add} className="px-6 py-3 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2"><Plus size={16} /> Add Resource</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {resources.map(r => (
          <div key={r.id} className="glass rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs px-2 py-1 rounded-full bg-brand-orange/20 text-brand-orange">{r.category}</span>
                <h4 className="font-semibold mt-2">{r.title}</h4>
                {r.description && <p className="text-gray-500 text-sm mt-1">{r.description}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={r.url} target="_blank" className="p-2 text-gray-400 hover:text-white transition"><ExternalLink size={16} /></a>
                <button onClick={() => remove(r.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {resources.length === 0 && <div className="col-span-2 text-center text-gray-500 py-12">No resources yet.</div>}
      </div>
    </div>
  )
}

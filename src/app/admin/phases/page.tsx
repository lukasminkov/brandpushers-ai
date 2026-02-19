'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

interface Phase { id: string; name: string; description: string; order: number }

export default function PhasesPage() {
  const [phases, setPhases] = useState<Phase[]>([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('phases').select('*').order('order')
    setPhases((data || []) as Phase[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!name.trim()) return
    await supabase.from('phases').insert({ name, description: desc, order: phases.length + 1 })
    setName(''); setDesc(''); load()
  }

  const remove = async (id: string) => {
    await supabase.from('phases').delete().eq('id', id)
    load()
  }

  const assignToAllMembers = async (phaseId: string) => {
    const { data: members } = await supabase.from('profiles').select('id').eq('role', 'member')
    if (!members) return
    const inserts = members.map(m => ({ member_id: m.id, phase_id: phaseId, status: 'not_started' as const }))
    await supabase.from('member_phases').upsert(inserts, { onConflict: 'member_id,phase_id' })
    alert('Assigned to all members!')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Phases</h1>
      
      <div className="glass rounded-2xl p-6 mb-8">
        <h3 className="font-bold mb-4">Add Phase</h3>
        <div className="flex gap-4">
          <input className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange" placeholder="Phase name" value={name} onChange={e => setName(e.target.value)} />
          <input className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <button onClick={add} className="px-6 py-3 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2"><Plus size={16} /> Add</button>
        </div>
      </div>

      <div className="space-y-3">
        {phases.map((p, i) => (
          <div key={p.id} className="glass rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm">{i + 1}</div>
              <div>
                <h4 className="font-semibold">{p.name}</h4>
                {p.description && <p className="text-gray-500 text-sm">{p.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => assignToAllMembers(p.id)} className="px-4 py-2 text-sm glass rounded-lg hover:bg-white/10 transition">Assign All</button>
              <button onClick={() => remove(p.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {phases.length === 0 && <div className="text-center text-gray-500 py-12">No phases yet. Create your first one above.</div>}
      </div>
    </div>
  )
}

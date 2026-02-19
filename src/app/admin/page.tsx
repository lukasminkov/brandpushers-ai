'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface Application {
  id: string
  user_id: string | null
  name: string
  email: string | null
  brand_stage: string
  answers: Record<string, string>
  status: string
  created_at: string
  profiles?: { email: string; full_name: string } | null
}

export default function AdminPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('applications').select('*, profiles(email, full_name)').order('created_at', { ascending: false })
    setApps((data || []) as Application[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (app: Application, status: string) => {
    await supabase.from('applications').update({ status }).eq('id', app.id)
    if (status === 'approved') {
      await supabase.from('profiles').update({ role: 'member', approved_at: new Date().toISOString() }).eq('id', app.user_id)
    }
    if (status === 'rejected') {
      await supabase.from('profiles').update({ role: 'pending' }).eq('id', app.user_id)
    }
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Applications</h1>
      {apps.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">No applications yet</div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <div key={app.id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{app.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${app.status === 'approved' ? 'bg-green-500/20 text-green-400' : app.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Stage: {app.brand_stage} • Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                  <p className="text-gray-500 text-sm mt-1">{app.email || app.profiles?.email || 'No email'}{app.profiles?.full_name ? ` • ${app.profiles.full_name}` : ''}</p>
                  {app.answers?.brandName && <p className="text-gray-400 mt-3 text-sm">Brand: {app.answers.brandName}</p>}
                  {app.answers?.category && <p className="text-gray-500 mt-1 text-sm">Category: {app.answers.category}</p>}
                  {app.answers?.about && <p className="text-gray-500 mt-1 text-sm">About: {app.answers.about}</p>}
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => updateStatus(app, 'approved')} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition"><CheckCircle size={20} /></button>
                    <button onClick={() => updateStatus(app, 'rejected')} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"><XCircle size={20} /></button>
                  </div>
                )}
                {app.status !== 'pending' && (
                  <button onClick={() => updateStatus(app, 'pending')} className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition"><Clock size={20} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Inbox } from 'lucide-react'

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
    const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
    if (error) console.error('Applications load error:', error)
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage incoming applications</p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Inbox size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-500">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => (
            <div
              key={app.id}
              className="rounded-2xl p-5 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-white">{app.name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      app.status === 'approved'
                        ? 'bg-green-500/15 text-green-400 border-green-500/25'
                        : app.status === 'rejected'
                        ? 'bg-red-500/15 text-red-400 border-red-500/25'
                        : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Stage: <span className="text-gray-300">{app.brand_stage}</span> · Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {app.email || app.profiles?.email || 'No email'}
                    {app.profiles?.full_name ? ` · ${app.profiles.full_name}` : ''}
                  </p>
                  {app.answers?.brandName && <p className="text-gray-400 mt-3 text-sm">Brand: <span className="text-gray-300">{app.answers.brandName}</span></p>}
                  {app.answers?.category && <p className="text-gray-500 mt-1 text-sm">Category: {app.answers.category}</p>}
                  {app.answers?.about && <p className="text-gray-500 mt-1 text-sm line-clamp-2">About: {app.answers.about}</p>}
                </div>
                {app.status === 'pending' ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => updateStatus(app, 'approved')}
                      className="p-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}
                      title="Approve"
                    >
                      <CheckCircle size={18} className="text-green-400" />
                    </button>
                    <button
                      onClick={() => updateStatus(app, 'rejected')}
                      className="p-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
                      title="Reject"
                    >
                      <XCircle size={18} className="text-red-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => updateStatus(app, 'pending')}
                    className="p-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)' }}
                    title="Reset to pending"
                  >
                    <Clock size={18} className="text-yellow-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

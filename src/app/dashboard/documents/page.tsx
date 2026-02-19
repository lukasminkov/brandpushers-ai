'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Trash2 } from 'lucide-react'

interface Doc { id: string; name: string; file_url: string; uploaded_at: string; phase_id: string | null }

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false })
    setDocs((data || []) as Doc[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('documents').upload(path, file)
    if (error) { alert(error.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    await supabase.from('documents').insert({ user_id: user.id, name: file.name, file_url: publicUrl })
    setUploading(false)
    load()
  }

  const remove = async (doc: Doc) => {
    await supabase.from('documents').delete().eq('id', doc.id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
        <label className="px-6 py-3 bg-brand-orange rounded-xl font-semibold hover:opacity-90 transition cursor-pointer flex items-center gap-2">
          <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
          <input type="file" className="hidden" onChange={upload} disabled={uploading} />
        </label>
      </div>

      <div className="space-y-3">
        {docs.map(d => (
          <div key={d.id} className="glass rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-brand-orange" size={20} />
              <div>
                <a href={d.file_url} target="_blank" className="font-semibold hover:text-brand-orange transition">{d.name}</a>
                <p className="text-gray-500 text-xs">{new Date(d.uploaded_at).toLocaleDateString()}</p>
              </div>
            </div>
            <button onClick={() => remove(d)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"><Trash2 size={16} /></button>
          </div>
        ))}
        {docs.length === 0 && <div className="text-center text-gray-500 py-12">No documents uploaded yet.</div>}
      </div>
    </div>
  )
}

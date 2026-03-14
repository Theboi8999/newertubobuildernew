'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; email: string; is_authorized: boolean; is_admin: boolean; generation_count: number }>>([])
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      setAuthorized(true)
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleAuthorized(id: string, current: boolean) {
    await supabase.from('profiles').update({ is_authorized: !current }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_authorized: !current } : u))
  }

  async function authorizeEmail() {
    if (!newEmail.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ is_authorized: true }).eq('email', newEmail.trim())
    setNewEmail('')
    setSaving(false)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading…</div>
  if (!authorized) return null

  return (
    <div className="min-h-screen bg-brand-bg text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <a href="/dashboard" className="text-brand-text-dim hover:text-white text-sm mb-4 inline-block">← Dashboard</a>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Authorize New User</h2>
          <div className="flex gap-3">
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="user@email.com"
              className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-white placeholder-brand-text-dim outline-none focus:border-brand-purple text-sm" />
            <button onClick={authorizeEmail} disabled={saving || !newEmail.trim()}
              className="px-6 py-2.5 rounded-xl bg-brand-purple text-white font-semibold text-sm disabled:opacity-40 hover:bg-brand-purple/80 transition-all">
              {saving ? 'Saving…' : 'Authorize'}
            </button>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-brand-border">
            <h2 className="font-semibold text-lg">All Users ({users.length})</h2>
          </div>
          <div className="divide-y divide-brand-border">
            {users.map(u => (
              <div key={u.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white font-medium">{u.email}</p>
                  <p className="text-xs text-brand-text-dim mt-0.5">{u.generation_count || 0} generations {u.is_admin ? '· Admin' : ''}</p>
                </div>
                <button onClick={() => toggleAuthorized(u.id, u.is_authorized)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${u.is_authorized ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30' : 'bg-brand-border text-brand-text-muted hover:bg-brand-purple/20 hover:text-brand-purple hover:border-brand-purple border border-transparent'}`}>
                  {u.is_authorized ? 'Authorized ✓' : 'Authorize'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

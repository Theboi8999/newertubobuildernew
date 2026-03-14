'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { qualityColor } from '@/lib/utils'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [generations, setGenerations] = useState<any[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'users' | 'generations' | 'failed' | 'scripts' | 'waitlist'>('users')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      const [{ data: u }, { data: g }, { data: s }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('generations').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('script_library').select('*').order('usage_count', { ascending: false }).limit(50),
        supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      ])
      setUsers(u || []); setGenerations(g || []); setScripts(s || []); setWaitlist(w || [])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleAuth(id: string, current: boolean) {
    await supabase.from('profiles').update({ is_authorized: !current }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_authorized: !current } : u))
  }

  async function authorizeEmail() {
    if (!newEmail.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ is_authorized: true }).eq('email', newEmail.trim())
    setNewEmail('')
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setSaving(false)
  }

  async function approveWaitlist(entry: any) {
    await supabase.from('waitlist').update({ status: 'approved' }).eq('id', entry.id)
    await supabase.from('profiles').update({ is_authorized: true }).eq('email', entry.email)
    setWaitlist(prev => prev.map(w => w.id === entry.id ? { ...w, status: 'approved' } : w))
  }

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading…</div>

  const failed = generations.filter(g => g.status === 'failed')
  const completed = generations.filter(g => g.status === 'complete')
  const avgQuality = completed.filter(g => g.output_metadata?.qualityScore).length
    ? Math.round(completed.reduce((a, g) => a + (g.output_metadata?.qualityScore || 0), 0) / completed.filter(g => g.output_metadata?.qualityScore).length)
    : 0

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <nav className="border-b border-brand-border bg-brand-bg/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-brand-text-dim hover:text-white text-sm">← Dashboard</a>
            <span className="text-brand-border">|</span>
            <span className="font-bold">Admin Panel</span>
          </div>
          <div className="flex gap-3">
            <a href="/admin/library" className="btn btn-secondary text-xs px-3 py-1.5">📚 Script Library</a>
            <a href="/admin/knowledge" className="btn btn-secondary text-xs px-3 py-1.5">🧠 Knowledge Editor</a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total Users', value: users.length, color: 'text-white' },
            { label: 'Generations', value: generations.length, color: 'text-white' },
            { label: 'Avg Quality', value: avgQuality ? `${avgQuality}/100` : '—', color: qualityColor(avgQuality) },
            { label: 'Failed', value: failed.length, color: failed.length > 0 ? 'text-brand-red' : 'text-brand-green' },
            { label: 'Waitlist', value: waitlist.length, color: 'text-brand-cyan' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-brand-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-brand-card border border-brand-border rounded-xl mb-6 w-fit flex-wrap">
          {([
            { key: 'users', label: `👥 Users (${users.length})` },
            { key: 'generations', label: `⚡ Generations` },
            { key: 'failed', label: `❌ Failed (${failed.length})` },
            { key: 'scripts', label: `📚 Scripts (${scripts.length})` },
            { key: 'waitlist', label: `📋 Waitlist (${waitlist.length})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`tab-btn ${tab === t.key ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div className="card p-5 mb-4">
              <p className="text-sm font-semibold mb-3">Authorize by email</p>
              <div className="flex gap-3">
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && authorizeEmail()}
                  placeholder="user@email.com" className="input flex-1 py-2.5" />
                <button onClick={authorizeEmail} disabled={saving || !newEmail.trim()} className="btn btn-primary px-5 py-2.5 text-sm">
                  {saving ? '…' : 'Authorize'}
                </button>
              </div>
            </div>
            <div className="card divide-y divide-brand-border">
              {users.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white">{u.email}</p>
                    <p className="text-xs text-brand-text-dim mt-0.5">{u.generation_count || 0} gens {u.is_admin ? '· Admin' : ''}</p>
                  </div>
                  <button onClick={() => toggleAuth(u.id, u.is_authorized)}
                    className={`btn text-xs px-4 py-1.5 ${u.is_authorized ? 'bg-brand-green/10 text-brand-green border border-brand-green/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30' : 'btn-secondary hover:border-brand-purple hover:text-brand-purple-light'}`}>
                    {u.is_authorized ? '✓ Authorized' : 'Authorize'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Generations */}
        {tab === 'generations' && (
          <div className="card divide-y divide-brand-border">
            {generations.map(g => (
              <div key={g.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{g.prompt}</p>
                  <p className="text-xs text-brand-text-dim mt-0.5">{g.system_type} · {new Date(g.created_at).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {g.output_metadata?.qualityScore && (
                    <span className={`text-xs font-semibold ${qualityColor(g.output_metadata.qualityScore)}`}>{g.output_metadata.qualityScore}/100</span>
                  )}
                  <span className={`badge text-xs ${g.status === 'complete' ? 'badge-green' : g.status === 'failed' ? 'badge-red' : 'badge-cyan'}`}>{g.status}</span>
                  {g.output_url && <a href={g.output_url} download className="text-xs text-brand-purple-light hover:text-white">Download</a>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Failed Generations */}
        {tab === 'failed' && (
          <div>
            {failed.length === 0 ? (
              <div className="text-center py-16 text-brand-text-dim">No failed generations 🎉</div>
            ) : (
              <div className="space-y-3">
                {failed.map(g => (
                  <div key={g.id} className="card p-5 border-red-500/20">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="text-sm text-white font-medium">{g.prompt}</p>
                      <span className="text-xs text-brand-text-dim flex-shrink-0">{new Date(g.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                    {g.output_metadata?.error && (
                      <p className="text-xs text-red-400 mb-3 p-2 bg-red-500/10 rounded-lg">{g.output_metadata.error}</p>
                    )}
                    <p className="text-xs text-brand-text-dim">System: {g.system_type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scripts */}
        {tab === 'scripts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.length === 0 && <div className="col-span-2 text-center py-16 text-brand-text-dim">No scripts yet — generated automatically as users build.</div>}
            {scripts.map(s => (
              <div key={s.id} className="card p-5">
                <div className="flex justify-between mb-2">
                  <p className="font-semibold text-white text-sm">{s.name}</p>
                  <span className="text-xs text-brand-text-dim">{s.usage_count} uses</span>
                </div>
                <p className="text-xs text-brand-text-dim mb-3">{s.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {(s.keywords || []).slice(0, 5).map((k: string) => (
                    <span key={k} className="badge badge-purple text-xs">{k}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Waitlist */}
        {tab === 'waitlist' && (
          <div className="card divide-y divide-brand-border">
            {waitlist.length === 0 && <div className="p-10 text-center text-brand-text-dim">No waitlist entries yet.</div>}
            {waitlist.map(w => (
              <div key={w.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium">{w.name}</p>
                  <p className="text-xs text-brand-text-dim">{w.email}</p>
                  {w.reason && <p className="text-xs text-brand-text-muted mt-1 italic">"{w.reason}"</p>}
                  <p className="text-xs text-brand-text-dim mt-1">{new Date(w.created_at).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="flex-shrink-0">
                  {w.status === 'approved' ? (
                    <span className="badge badge-green text-xs">Approved</span>
                  ) : (
                    <button onClick={() => approveWaitlist(w)} className="btn btn-primary text-xs px-4 py-1.5">Approve</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Script { id: string; name: string; description: string; luau_code: string; keywords: string[]; usage_count: number; quality_score: number; created_at: string }

export default function LibraryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Script | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      const { data } = await supabase.from('script_library').select('*').order('usage_count', { ascending: false })
      setScripts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = scripts.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading…</div>

  return (
    <div className="min-h-screen bg-brand-bg text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <a href="/admin" className="text-brand-text-dim hover:text-white text-sm mb-4 inline-block">← Admin</a>
          <h1 className="text-3xl font-bold">Script Library</h1>
          <p className="text-brand-text-muted mt-1">{scripts.length} auto-generated scripts</p>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search scripts…"
          className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-white placeholder-brand-text-dim outline-none focus:border-brand-purple mb-6 text-sm" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(selected?.id === s.id ? null : s)}
              className="bg-brand-card border border-brand-border rounded-2xl p-5 cursor-pointer hover:border-brand-purple transition-all">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-white text-sm">{s.name}</p>
                <span className="text-xs text-brand-text-dim">{s.usage_count} uses</span>
              </div>
              <p className="text-xs text-brand-text-dim mb-3">{s.description}</p>
              <div className="flex gap-2 flex-wrap">
                {(s.keywords || []).slice(0, 4).map(k => (
                  <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-brand-purple/20 text-brand-purple-light">{k}</span>
                ))}
              </div>
              {selected?.id === s.id && (
                <pre className="mt-4 p-3 bg-brand-surface rounded-xl text-xs text-brand-text-muted overflow-auto max-h-48 border border-brand-border">
                  {s.luau_code}
                </pre>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-brand-text-dim">
            {search ? 'No scripts match your search' : 'No scripts in library yet — they get added automatically as users generate assets'}
          </div>
        )}
      </div>
    </div>
  )
}

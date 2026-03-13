'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Script {
  id: string; name: string; description: string; keywords: string[]
  luau_code: string; quality_score: number; usage_count: number
  created_at: string; updated_at: string
}

export default function LibraryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [scripts, setScripts] = useState<Script[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Script | null>(null)
  const [editing, setEditing] = useState(false)
  const [editCode, setEditCode] = useState('')
  const [saving, setSaving] = useState(false)
  const searchTimer = useRef<NodeJS.Timeout>()

  useEffect(() => { checkAdmin() }, [])
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); loadScripts(1, search) }, 400)
  }, [search])
  useEffect(() => { loadScripts(page, search) }, [page])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!p?.is_admin) { router.push('/dashboard'); return }
    loadScripts(1, '')
  }

  async function loadScripts(pg: number, q: string) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), ...(q ? { search: q } : {}) })
    const res = await fetch(`/api/library?${params}`)
    const data = await res.json()
    setScripts(data.scripts || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  async function saveScript() {
    if (!selected) return
    setSaving(true)
    await fetch('/api/library', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, name: selected.name, description: selected.description, luau_code: editCode, keywords: selected.keywords, quality_score: selected.quality_score }),
    })
    setSaving(false)
    setEditing(false)
    loadScripts(page, search)
  }

  const totalPages = Math.ceil(total / 20)
  const scoreColor = (s: number) => s >= 80 ? 'text-brand-green' : s >= 65 ? 'text-brand-orange' : 'text-brand-red'

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-brand-border/50 backdrop-blur-xl bg-brand-bg/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-brand-text-muted hover:text-brand-text transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </a>
            <span className="font-display font-bold text-brand-text">Script Library</span>
            <span className="font-mono text-xs text-brand-text-dim px-2 py-0.5 rounded bg-brand-surface border border-brand-border">{total} scripts</span>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search scripts…" className="input px-3 py-2 rounded-xl text-sm w-64"/>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* Script list */}
          <div className="space-y-2">
            {loading && <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-brand-purple border-t-transparent animate-spin"/></div>}
            {!loading && scripts.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-3xl mb-3">📭</p>
                <p className="font-display font-bold text-brand-text mb-1">No scripts found</p>
                <p className="font-body text-xs text-brand-text-muted">{search ? 'Try a different search term' : 'The library is empty'}</p>
              </div>
            )}
            {scripts.map(s => (
              <button key={s.id} onClick={() => { setSelected(s); setEditCode(s.luau_code); setEditing(false) }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === s.id ? 'border-brand-purple/50 bg-brand-purple/10' : 'card hover:border-brand-border/80'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-display font-semibold text-brand-text text-sm leading-tight">{s.name}</p>
                  <span className={`font-display font-bold text-xs flex-shrink-0 ${scoreColor(s.quality_score)}`}>{s.quality_score}</span>
                </div>
                <p className="font-body text-xs text-brand-text-muted line-clamp-2 mb-2">{s.description}</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-brand-text-dim">{s.usage_count} uses</span>
                  <span className="text-brand-text-dim">·</span>
                  <span className="font-mono text-xs text-brand-text-dim">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                {s.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.keywords.slice(0, 4).map((kw: string) => (
                      <span key={kw} className="text-xs px-2 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-text-dim font-mono">{kw}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-text-muted disabled:opacity-40 hover:text-brand-text transition-all">←</button>
                <span className="font-mono text-xs text-brand-text-dim">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-text-muted disabled:opacity-40 hover:text-brand-text transition-all">→</button>
              </div>
            )}
          </div>

          {/* Script detail */}
          <div>
            {!selected ? (
              <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <p className="text-5xl mb-4">📚</p>
                <p className="font-display font-bold text-brand-text mb-2">Select a script</p>
                <p className="font-body text-xs text-brand-text-muted">Click any script on the left to view and edit it.</p>
              </div>
            ) : (
              <div className="card p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display font-bold text-brand-text text-xl mb-1">{selected.name}</h2>
                    <p className="font-body text-sm text-brand-text-muted">{selected.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className={`font-display font-black text-2xl ${scoreColor(selected.quality_score)}`}>{selected.quality_score}</div>
                      <div className="font-mono text-xs text-brand-text-dim">/100</div>
                    </div>
                    <button onClick={() => setEditing(!editing)}
                      className={`px-4 py-2 rounded-xl text-sm font-mono transition-all ${editing ? 'bg-brand-orange/20 border border-brand-orange/40 text-brand-orange' : 'bg-brand-purple/20 border border-brand-purple/40 text-brand-purple-light'}`}>
                      {editing ? '✕ Cancel' : '✏️ Edit'}
                    </button>
                    {editing && (
                      <button onClick={saveScript} disabled={saving}
                        className="btn-primary px-4 py-2 rounded-xl text-sm font-mono">
                        {saving ? '…' : '💾 Save'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Usage Count', value: selected.usage_count },
                    { label: 'Created', value: new Date(selected.created_at).toLocaleDateString() },
                    { label: 'Updated', value: new Date(selected.updated_at).toLocaleDateString() },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                      <p className="font-mono text-xs text-brand-text-dim">{s.label}</p>
                      <p className="font-display font-semibold text-brand-text text-sm">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Keywords */}
                {selected.keywords?.length > 0 && (
                  <div>
                    <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.keywords.map((kw: string) => (
                        <span key={kw} className="text-xs px-2.5 py-1 rounded-lg bg-brand-surface border border-brand-border text-brand-text-dim font-mono">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code */}
                <div>
                  <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">Luau Code</p>
                  {editing ? (
                    <textarea value={editCode} onChange={e => setEditCode(e.target.value)}
                      className="input w-full px-4 py-3 rounded-xl text-xs font-mono resize-none"
                      rows={24} spellCheck={false}/>
                  ) : (
                    <div className="relative rounded-xl bg-brand-bg border border-brand-border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-brand-border">
                        <span className="font-mono text-xs text-brand-text-dim">Luau</span>
                        <button onClick={() => navigator.clipboard.writeText(selected.luau_code)}
                          className="font-mono text-xs text-brand-text-dim hover:text-brand-text transition-colors">Copy</button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-brand-text-muted overflow-x-auto max-h-[480px] overflow-y-auto leading-relaxed">
                        <code>{selected.luau_code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

'use client'
// app/admin/library/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LibraryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [scripts, setScripts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('script_library')
        .select('*')
        .order('usage_count', { ascending: false })
      setScripts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = scripts.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase()) ||
    (s.keywords || []).some((k: string) => k.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading…</div>
  )

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <nav className="border-b border-brand-border bg-brand-bg/90 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <a href="/admin" className="text-brand-text-dim hover:text-white text-sm">← Admin</a>
          <span className="text-brand-border">|</span>
          <span className="font-bold">Script Library</span>
          <span className="text-brand-text-dim text-sm">({scripts.length} scripts)</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-4 p-3 rounded-xl bg-brand-surface border border-brand-border">
          <p className="text-xs text-brand-text-muted font-body">
            Scripts are automatically generated and saved here when a generation requires a scripting concept not already in the knowledge base. They are reused in future generations, improving quality and speed over time.
          </p>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search scripts by name, description, or keyword…"
          className="input mb-6"
        />

        {filtered.length === 0 && (
          <div className="text-center py-20 text-brand-text-dim">
            {search
              ? 'No scripts match your search.'
              : 'No scripts yet — they are generated automatically as users build assets.'}
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="card p-5">
              <div
                className="flex items-start justify-between gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm">{s.name}</p>
                  <p className="text-xs text-brand-text-dim mt-0.5">{s.description}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(s.keywords || []).slice(0, 6).map((k: string) => (
                      <span key={k} className="badge badge-purple text-xs">{k}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 text-xs text-brand-text-dim space-y-1">
                  <p>{s.usage_count} uses</p>
                  <p className={s.quality_score >= 80 ? 'text-brand-green' : 'text-brand-orange'}>
                    {s.quality_score}/100
                  </p>
                  <p>{expanded === s.id ? '▲' : '▼'}</p>
                </div>
              </div>

              {expanded === s.id && (
                <pre className="mt-4 p-4 bg-brand-surface rounded-xl text-xs text-brand-text-muted overflow-auto max-h-64 border border-brand-border">
                  {s.luau_code}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

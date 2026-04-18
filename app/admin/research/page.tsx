'use client'
// app/admin/research/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface CacheRow {
  id: string
  building_type: string
  confidence_score: number
  last_researched_at: string
  research_version: number
}

function confidenceColor(score: number) {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export default function ResearchAdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [rows, setRows] = useState<CacheRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newType, setNewType] = useState('')
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [researching, setResearching] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      await loadRows()
    }
    init()
  }, [])

  async function loadRows() {
    const { data } = await supabase
      .from('research_cache')
      .select('id, building_type, confidence_score, last_researched_at, research_version')
      .order('last_researched_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  async function forceRefresh(buildingType: string) {
    setRefreshing(buildingType)
    await fetch('/api/admin/research/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingType }),
    })
    await loadRows()
    setRefreshing(null)
  }

  async function researchNew() {
    if (!newType.trim()) return
    setResearching(true)
    await fetch('/api/admin/research/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingType: newType.trim() }),
    })
    setNewType('')
    await loadRows()
    setResearching(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <a href="/admin" className="text-brand-text-muted hover:text-white transition-colors text-sm">← Admin</a>
          <span className="font-bold text-white">Research Cache</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-2xl font-bold text-white mb-8">Building Research Cache</h1>

        {/* Research new type */}
        <div className="card p-6 mb-8">
          <p className="text-sm font-semibold text-white mb-3">Research New Building Type</p>
          <div className="flex gap-3">
            <input
              value={newType}
              onChange={e => setNewType(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') researchNew() }}
              placeholder="e.g. victorian_hospital, formula_1_pit_lane"
              className="input flex-1 text-sm"
            />
            <button
              onClick={researchNew}
              disabled={researching || !newType.trim()}
              className="btn btn-primary px-5 text-sm"
            >
              {researching ? 'Researching…' : 'Research →'}
            </button>
          </div>
        </div>

        {/* Cache table */}
        {rows.length === 0 ? (
          <div className="card p-8 text-center text-brand-text-muted text-sm">No cached research yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Building Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Confidence</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Version</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Last Researched</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-brand-border last:border-0 hover:bg-brand-surface/50">
                    <td className="px-5 py-3 text-white font-mono text-xs">{row.building_type}</td>
                    <td className={`px-5 py-3 font-semibold ${confidenceColor(row.confidence_score)}`}>
                      {row.confidence_score}/100
                    </td>
                    <td className="px-5 py-3 text-brand-text-muted">v{row.research_version}</td>
                    <td className="px-5 py-3 text-brand-text-muted text-xs">
                      {new Date(row.last_researched_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => forceRefresh(row.building_type)}
                        disabled={refreshing === row.building_type}
                        className="text-xs text-brand-purple-light hover:text-white transition-colors disabled:opacity-50"
                      >
                        {refreshing === row.building_type ? 'Refreshing…' : 'Force Re-research'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

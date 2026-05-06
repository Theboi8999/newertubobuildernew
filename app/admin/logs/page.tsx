'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'complete' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
    status === 'failed' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cls}`}>{status}</span>
}

function QualityBreakdown({ checks }: { checks: any[] }) {
  if (!checks || checks.length === 0) return <span className="text-brand-text-dim text-xs">—</span>
  const passed = checks.filter((c: any) => c.passed).length
  const total = checks.length
  const pct = Math.round((passed / total) * 100)
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-mono ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
        {passed}/{total}
      </span>
      <div className="w-12 h-1.5 bg-brand-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function TrendChart({ rows }: { rows: any[] }) {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const dayData = days.map(day => {
    const next = new Date(day); next.setDate(next.getDate() + 1)
    const dayRows = rows.filter(r => {
      const t = new Date(r.created_at)
      return t >= day && t < next && r.output_metadata?.qualityScore
    })
    const avg = dayRows.length
      ? Math.round(dayRows.reduce((s: number, r: any) => s + r.output_metadata.qualityScore, 0) / dayRows.length)
      : 0
    return { label: day.toLocaleDateString('en-GB', { weekday: 'short' }), avg, count: dayRows.length }
  })

  const maxAvg = Math.max(...dayData.map(d => d.avg), 1)

  return (
    <div className="card p-5 mb-8">
      <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-4">Quality Score Trend — Last 7 Days</p>
      <div className="flex items-end gap-2 h-20">
        {dayData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-brand-text-dim font-mono">{d.avg > 0 ? d.avg : ''}</span>
            <div className="w-full rounded-t-sm bg-brand-surface relative overflow-hidden" style={{ height: 48 }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-brand-purple/60 transition-all"
                style={{ height: `${d.avg > 0 ? Math.round((d.avg / maxAvg) * 48) : 2}px` }}
              />
            </div>
            <span className="text-xs text-brand-text-dim">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminLogsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<any[]>([])
  const [totals, setTotals] = useState({ today: 0, avgQuality: 0, failed: 0 })
  const [expanded, setExpanded] = useState<string | null>(null)

  // Filters
  const [scoreMin, setScoreMin] = useState(0)
  const [scoreMax, setScoreMax] = useState(100)
  const [buildingTypeFilter, setBuildingTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('generations')
        .select('id,prompt,status,output_metadata,created_at,system_type')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) {
        setRows(data)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const todayRows = data.filter(r => new Date(r.created_at) >= today)
        const failed = data.filter(r => r.status === 'failed').length
        const scores = data.filter(r => r.output_metadata?.qualityScore).map(r => r.output_metadata.qualityScore as number)
        const avgQuality = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        setTotals({ today: todayRows.length, avgQuality, failed })
      }
      setLoading(false)
    }
    init()
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const qs = r.output_metadata?.qualityScore ?? 0
      if (qs > 0 && (qs < scoreMin || qs > scoreMax)) return false
      if (buildingTypeFilter) {
        const bt = (r.output_metadata?.buildingType || r.prompt || '').toLowerCase()
        if (!bt.includes(buildingTypeFilter.toLowerCase())) return false
      }
      if (statusFilter && r.status !== statusFilter) return false
      return true
    })
  }, [rows, scoreMin, scoreMax, buildingTypeFilter, statusFilter])

  function exportCsv() {
    const headers = ['Time', 'Prompt', 'Status', 'Quality', 'Parts', 'Checks Passed', 'Building Type', 'Suggestions']
    const csvRows = filteredRows.map(r => {
      const checks = r.output_metadata?.qualityChecks || []
      const passed = checks.filter((c: any) => c.passed).length
      const suggestions = (r.output_metadata?.suggestions || []).join(' | ')
      return [
        new Date(r.created_at).toISOString(),
        `"${(r.prompt || '').replace(/"/g, "'")}"`,
        r.status,
        r.output_metadata?.qualityScore ?? '',
        r.output_metadata?.partCount ?? '',
        `${passed}/${checks.length}`,
        r.output_metadata?.buildingType || '',
        `"${suggestions.replace(/"/g, "'")}"`,
      ].join(',')
    })
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `turbobuilder-logs-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
          <span className="font-bold text-white">Generation Logs</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Today', value: totals.today },
            { label: 'Avg Quality', value: totals.avgQuality ? `${totals.avgQuality}/100` : '–' },
            { label: 'Failed', value: totals.failed },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-brand-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <TrendChart rows={rows} />

        {/* Filters */}
        <div className="card p-5 mb-4">
          <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-3">Filters</p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-brand-text-muted mb-1">Quality Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={100} value={scoreMin}
                  onChange={e => setScoreMin(Number(e.target.value))}
                  className="input text-xs w-16 py-1 px-2"
                />
                <span className="text-brand-text-dim text-xs">–</span>
                <input
                  type="number" min={0} max={100} value={scoreMax}
                  onChange={e => setScoreMax(Number(e.target.value))}
                  className="input text-xs w-16 py-1 px-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-brand-text-muted mb-1">Building Type</label>
              <input
                type="text" value={buildingTypeFilter}
                onChange={e => setBuildingTypeFilter(e.target.value)}
                placeholder="e.g. peranakan"
                className="input text-xs py-1 px-2 w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-text-muted mb-1">Status</label>
              <select
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="input text-xs py-1 px-2"
              >
                <option value="">All</option>
                {['complete', 'failed', 'queued', 'generating'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => { setScoreMin(0); setScoreMax(100); setBuildingTypeFilter(''); setStatusFilter('') }}
                className="btn btn-secondary text-xs px-3 py-1.5"
              >
                Reset
              </button>
              <button onClick={exportCsv} className="btn btn-secondary text-xs px-3 py-1.5">
                Export CSV
              </button>
            </div>
          </div>
          <p className="text-xs text-brand-text-dim mt-2">{filteredRows.length} of {rows.length} rows</p>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-brand-border text-brand-text-muted">
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Prompt</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Quality</th>
                <th className="px-4 py-3 text-right">Parts</th>
                <th className="px-4 py-3 text-right">Checks</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(r => (
                <>
                  <tr
                    key={r.id}
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="border-b border-brand-border hover:bg-brand-surface cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-brand-text-muted font-mono whitespace-nowrap">
                      {new Date(r.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-white max-w-xs truncate">
                      {r.prompt?.slice(0, 40)}{r.prompt?.length > 40 ? '…' : ''}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right text-brand-text-muted">
                      {r.output_metadata?.qualityScore ?? '–'}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-text-muted">
                      {r.output_metadata?.partCount ?? '–'}
                    </td>
                    <td className="px-4 py-3 flex justify-end">
                      <QualityBreakdown checks={r.output_metadata?.qualityChecks || []} />
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr key={`${r.id}-detail`} className="border-b border-brand-border bg-brand-surface">
                      <td colSpan={6} className="px-4 py-3">
                        {r.output_metadata?.qualityChecks?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-brand-text-muted mb-2">Quality Checks</p>
                            <div className="grid grid-cols-2 gap-1">
                              {r.output_metadata.qualityChecks.map((c: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className={c.passed ? 'text-green-400' : 'text-red-400'}>{c.passed ? '✓' : '✗'}</span>
                                    <span className={c.passed ? 'text-brand-text-muted' : 'text-red-400'}>{c.name}</span>
                                  </div>
                                  <span className="text-brand-text-dim">{c.note}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {r.output_metadata?.suggestions?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-brand-text-muted mb-1">Suggestions</p>
                            {r.output_metadata.suggestions.map((s: string, i: number) => (
                              <p key={i} className="text-xs text-yellow-300">• {s}</p>
                            ))}
                          </div>
                        )}
                        <pre className="text-xs text-brand-text-muted overflow-auto max-h-40 whitespace-pre-wrap mt-2">
                          {JSON.stringify({ qualityScore: r.output_metadata?.qualityScore, partCount: r.output_metadata?.partCount, buildingType: r.output_metadata?.buildingType, qualityNotes: r.output_metadata?.qualityNotes }, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <p className="text-center text-brand-text-muted text-sm py-8">No generations match filters</p>
          )}
        </div>
      </div>
    </div>
  )
}

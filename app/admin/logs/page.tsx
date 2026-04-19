'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'complete' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
    status === 'failed' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cls}`}>{status}</span>
}

export default function AdminLogsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<any[]>([])
  const [totals, setTotals] = useState({ today: 0, avgQuality: 0, failed: 0 })
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('generations')
        .select('id,prompt,status,output_metadata,created_at')
        .order('created_at', { ascending: false })
        .limit(20)

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

        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-brand-border text-brand-text-muted">
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Prompt</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Quality</th>
                <th className="px-4 py-3 text-right">Parts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
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
                  </tr>
                  {expanded === r.id && (
                    <tr key={`${r.id}-detail`} className="border-b border-brand-border bg-brand-surface">
                      <td colSpan={5} className="px-4 py-3">
                        <pre className="text-xs text-brand-text-muted overflow-auto max-h-40 whitespace-pre-wrap">
                          {JSON.stringify(r.output_metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-center text-brand-text-muted text-sm py-8">No generations yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

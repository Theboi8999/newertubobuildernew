— create folder)



'use client'
// app/admin/research-queue/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResearchQueuePage() {
  const router = useRouter()
  const supabase = createClient()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [topic, setTopic] = useState('')
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      loadLogs()
    }
    init()
  }, [])

  async function loadLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('research_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setLogs(data || [])
    setLoading(false)
  }

  async function runResearch() {
    if (!topic.trim()) return
    setRunning(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`✅ Learned ${data.entries} facts about "${topic}"`)
        setTopic('')
        loadLogs()
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch {
      setMessage('❌ Request failed')
    }
    setRunning(false)
  }

  return (
    <main className="min-h-screen bg-brand-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/admin')} className="text-brand-text-muted hover:text-brand-text text-sm">← Admin</button>
          <h1 className="font-display font-bold text-2xl text-brand-text">🔬 Research Queue</h1>
          <span className="ml-auto font-mono text-xs text-brand-text-muted bg-brand-surface px-3 py-1 rounded-lg border border-brand-border">{logs.length} runs</span>
        </div>

        <div className="card p-4 flex gap-3 mb-6">
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Topic to research (e.g. 'UK ambulance station', 'fire engine ELS')"
            className="input flex-1 px-4 py-2 rounded-xl text-sm"
            onKeyDown={e => e.key === 'Enter' && runResearch()}
          />
          <button
            onClick={runResearch}
            disabled={running || !topic.trim()}
            className="btn-primary px-6 py-2 rounded-xl text-sm font-display font-semibold"
          >
            {running ? '🔬 Researching...' : '🔬 Research'}
          </button>
          <button onClick={loadLogs} className="px-4 py-2 rounded-xl border border-brand-border text-brand-text-muted hover:text-brand-text text-sm">↻</button>
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-4 font-body text-sm border ${message.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center text-brand-text-muted py-12">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🔬</p>
            <p className="font-display font-bold text-brand-text mb-2">No research runs yet</p>
            <p className="font-body text-sm text-brand-text-muted">Enter a topic above to start building the AI knowledge base</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'complete' ? 'bg-green-400' : log.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
                  <span className="font-display font-semibold text-brand-text">{log.topic}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${log.status === 'complete' ? 'text-green-300 bg-green-500/10' : log.status === 'failed' ? 'text-red-300 bg-red-500/10' : 'text-yellow-300 bg-yellow-500/10'}`}>
                    {log.status}
                  </span>
                  <span className="font-mono text-xs text-brand-text-dim ml-auto">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                {log.findings && (
                  <p className="font-body text-xs text-brand-text-muted">{log.findings}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

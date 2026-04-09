'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface KnowledgeEntry {
  id: string
  topic: string
  category: string
  content: string
  source: string
  quality_score: number
  created_at: string
  times_used: number
}

interface ResearchLog {
  id: string
  topic: string
  status: string
  findings: string
  created_at: string
}

export default function KnowledgeBasePage() {
  const router = useRouter()
  const supabase = createClient()
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [logs, setLogs] = useState<ResearchLog[]>([])
  const [loading, setLoading] = useState(true)
  const [researching, setResearching] = useState(false)
  const [topic, setTopic] = useState('')
  const [activeTab, setActiveTab] = useState<'knowledge'|'logs'|'teach'>('knowledge')
  const [teachTopic, setTeachTopic] = useState('')
  const [teachContent, setTeachContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { checkAdmin(); loadData() }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!data?.is_admin) router.push('/dashboard')
  }

  async function loadData() {
    setLoading(true)
    const [{ data: k }, { data: l }] = await Promise.all([
      supabase.from('ai_knowledge').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('research_logs').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    setKnowledge(k || [])
    setLogs(l || [])
    setLoading(false)
  }

  async function triggerResearch() {
    if (!topic.trim()) return
    setResearching(true); setMessage('')
    try {
      const res = await fetch('/api/admin/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (data.success) { setMessage(`✅ Learned ${data.entries} facts about "${topic}"`); setTopic(''); loadData() }
      else setMessage(`❌ ${data.error}`)
    } catch { setMessage('❌ Request failed') }
    setResearching(false)
  }

  async function saveManualKnowledge() {
    if (!teachTopic.trim() || !teachContent.trim()) return
    setSaving(true)
    await supabase.from('ai_knowledge').insert({ topic: teachTopic, category: 'manual', content: teachContent, source: 'Admin', quality_score: 95, times_used: 0 })
    setMessage('✅ Knowledge saved!'); setTeachTopic(''); setTeachContent(''); loadData()
    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-brand-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/admin')} className="text-brand-text-muted hover:text-brand-text text-sm">← Admin</button>
          <h1 className="font-display font-bold text-2xl text-brand-text">🧠 AI Knowledge Base</h1>
          <span className="ml-auto font-mono text-xs text-brand-text-muted bg-brand-surface px-3 py-1 rounded-lg border border-brand-border">{knowledge.length} entries</span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Entries', value: knowledge.length },
            { label: 'Building Topics', value: knowledge.filter(k => k.category === 'building').length },
            { label: 'Research Runs', value: logs.length },
            { label: 'Avg Quality', value: knowledge.length ? Math.round(knowledge.reduce((a,k) => a+k.quality_score,0)/knowledge.length)+'%' : '—' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className="font-mono text-2xl font-bold text-brand-purple-light">{s.value}</p>
              <p className="font-body text-xs text-brand-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(['knowledge','logs','teach'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-display text-sm font-semibold capitalize transition-all ${activeTab===tab?'bg-brand-purple text-white':'bg-brand-surface text-brand-text-muted hover:text-brand-text border border-brand-border'}`}>
              {tab==='knowledge'?'📚 Knowledge':tab==='logs'?'🔬 Research Logs':'✏️ Teach Manually'}
            </button>
          ))}
        </div>

        {message && <div className={`p-3 rounded-xl mb-4 font-body text-sm border ${message.startsWith('✅')?'bg-green-500/10 border-green-500/30 text-green-300':'bg-red-500/10 border-red-500/30 text-red-300'}`}>{message}</div>}

        {activeTab==='knowledge' && (
          <div className="space-y-4">
            <div className="card p-4 flex gap-3">
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic to research (e.g. 'UK fire station', 'police car ELS')" className="input flex-1 px-4 py-2 rounded-xl text-sm" onKeyDown={e=>e.key==='Enter'&&triggerResearch()} />
              <button onClick={triggerResearch} disabled={researching||!topic.trim()} className="btn-primary px-6 py-2 rounded-xl text-sm font-display font-semibold">{researching?'🔬 Researching...':'🔬 Research'}</button>
              <button onClick={loadData} className="px-4 py-2 rounded-xl border border-brand-border text-brand-text-muted hover:text-brand-text text-sm">↻</button>
            </div>
            {loading ? <div className="text-center text-brand-text-muted py-12">Loading...</div>
            : knowledge.length===0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3">🧠</p>
                <p className="font-display font-bold text-brand-text mb-2">No knowledge yet</p>
                <p className="font-body text-sm text-brand-text-muted">Type a topic and click Research to start teaching TurboBuilder</p>
              </div>
            ) : knowledge.map(k => (
              <div key={k.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-brand-surface text-brand-text-muted border-brand-border font-mono">{k.category}</span>
                      <span className="font-display font-semibold text-brand-text">{k.topic}</span>
                      <span className="font-mono text-xs text-brand-green ml-auto">Q:{k.quality_score}%</span>
                      <span className="font-mono text-xs text-brand-text-dim">×{k.times_used}</span>
                    </div>
                    <p className="font-body text-xs text-brand-text-muted line-clamp-3">{k.content}</p>
                    <p className="font-mono text-xs text-brand-text-dim mt-1">{k.source} · {new Date(k.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={()=>supabase.from('ai_knowledge').delete().eq('id',k.id).then(()=>loadData())} className="text-brand-text-dim hover:text-red-400 text-lg">×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab==='logs' && (
          <div className="space-y-3">
            {logs.length===0 ? <div className="card p-12 text-center"><p className="font-body text-sm text-brand-text-muted">No research runs yet.</p></div>
            : logs.map(log => (
              <div key={log.id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-2 h-2 rounded-full ${log.status==='complete'?'bg-green-400':log.status==='failed'?'bg-red-400':'bg-yellow-400 animate-pulse'}`} />
                  <span className="font-display font-semibold text-brand-text">{log.topic}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${log.status==='complete'?'text-green-300 bg-green-500/10':'text-red-300 bg-red-500/10'}`}>{log.status}</span>
                  <span className="font-mono text-xs text-brand-text-dim ml-auto">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="font-body text-xs text-brand-text-muted">{log.findings}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab==='teach' && (
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-bold text-brand-text">Manually teach TurboBuilder</h2>
            <p className="font-body text-sm text-brand-text-muted">Add expert knowledge directly. Gets injected into generations for matching topics.</p>
            <div>
              <label className="block font-body text-xs text-brand-text-muted mb-1.5">Topic</label>
              <input value={teachTopic} onChange={e=>setTeachTopic(e.target.value)} placeholder="e.g. 'UK fire station layout'" className="input w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block font-body text-xs text-brand-text-muted mb-1.5">Knowledge</label>
              <textarea value={teachContent} onChange={e=>setTeachContent(e.target.value)} placeholder="Detailed knowledge about this topic — layouts, dimensions, equipment, colors..." className="input w-full px-4 py-3 rounded-xl text-sm h-48 resize-none" />
            </div>
            <button onClick={saveManualKnowledge} disabled={saving||!teachTopic.trim()||!teachContent.trim()} className="btn-primary w-full py-3 rounded-xl font-display font-semibold">{saving?'Saving...':'💾 Save Knowledge'}</button>
          </div>
        )}
      </div>
    </main>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState({ users: 0, generations: 0, avgQuality: 0, failed: 0, waitlist: 0, knowledge: 0, researchLogs: 0 })
  const [users, setUsers] = useState<any[]>([])
  const [generations, setGenerations] = useState<any[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [tab, setTab] = useState<'users'|'gens'|'failed'|'scripts'|'waitlist'>('users')
  const [authorizeEmail, setAuthorizeEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkAdmin(); loadData() }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!data?.is_admin) router.push('/dashboard')
  }

  async function loadData() {
    setLoading(true)
    const [{ data: u }, { data: g }, { data: s }, { data: w }, { data: k }, { data: rl }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('generations').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('script_library').select('*').order('usage_count', { ascending: false }).limit(20),
      supabase.from('authorized_emails').select('*').order('added_at', { ascending: false }),
      supabase.from('ai_knowledge').select('id').limit(1000),
      supabase.from('research_logs').select('id').limit(1000),
    ])
    setUsers(u || []); setGenerations(g || []); setScripts(s || []); setWaitlist(w || [])
    const allGens = g || []
    const failed = allGens.filter(g => g.status === 'failed').length
    const avgQ = allGens.length ? Math.round(allGens.reduce((a, g) => a + (g.output_metadata?.qualityScore || 85), 0) / allGens.length) : 0
    setStats({ users: u?.length || 0, generations: allGens.length, avgQuality: avgQ, failed, waitlist: w?.length || 0, knowledge: k?.length || 0, researchLogs: rl?.length || 0 })
    setLoading(false)
  }

  async function authorizeUser() {
    if (!authorizeEmail.trim()) return
    await supabase.from('authorized_emails').insert({ email: authorizeEmail })
    await supabase.from('profiles').update({ is_authorized: true }).eq('email', authorizeEmail)
    setAuthorizeEmail(''); loadData()
  }

  const navCards = [
    { label: '📊 Analytics', desc: 'Live feed, charts, generation history', href: '/admin/analytics', color: 'from-purple-500/20 to-blue-500/20' },
    { label: '🧠 Knowledge Base', desc: `${stats.knowledge} entries · Research & teach`, href: '/admin/knowledge-base', color: 'from-cyan-500/20 to-teal-500/20' },
    { label: '🔬 Research Queue', desc: `${stats.researchLogs} runs · Bulk research`, href: '/admin/research-queue', color: 'from-orange-500/20 to-red-500/20' },
    { label: '📚 Script Library', desc: `${scripts.length} scripts`, href: '/admin/library', color: 'from-green-500/20 to-emerald-500/20' },
  ]

  return (
    <main className="min-h-screen bg-brand-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-brand-text-muted hover:text-brand-text text-sm">← Dashboard</button>
          <h1 className="font-display font-bold text-2xl text-brand-text">Admin Panel</h1>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.users },
            { label: 'Generations', value: stats.generations },
            { label: 'Avg Quality', value: `${stats.avgQuality}/100`, highlight: stats.avgQuality >= 80 ? 'text-brand-green' : 'text-brand-yellow' },
            { label: 'Failed', value: stats.failed, highlight: stats.failed > 0 ? 'text-brand-red' : 'text-brand-green' },
            { label: 'Knowledge', value: stats.knowledge, highlight: 'text-brand-cyan' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`font-mono text-2xl font-bold ${s.highlight || 'text-brand-text'}`}>{s.value}</p>
              <p className="font-body text-xs text-brand-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {navCards.map(card => (
            <button key={card.href} onClick={() => router.push(card.href)}
              className={`card p-5 text-left bg-gradient-to-br ${card.color} hover:scale-[1.02] transition-transform`}>
              <p className="font-display font-bold text-brand-text mb-1">{card.label}</p>
              <p className="font-body text-xs text-brand-text-muted">{card.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {(['users','gens','failed','scripts','waitlist'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-display text-sm font-semibold capitalize transition-all ${tab===t?'bg-brand-purple text-white':'bg-brand-surface text-brand-text-muted hover:text-brand-text border border-brand-border'}`}>
              {t==='users'?`👥 Users (${stats.users})`:t==='gens'?`⚡ Generations (${stats.generations})`:t==='failed'?`❌ Failed (${stats.failed})`:t==='scripts'?`📚 Scripts (${scripts.length})`:`📋 Waitlist (${stats.waitlist})`}
            </button>
          ))}
        </div>

        {tab==='users'&&<div className="card p-5"><div className="flex gap-3 mb-4"><input value={authorizeEmail} onChange={e=>setAuthorizeEmail(e.target.value)} placeholder="user@email.com" className="input flex-1 px-4 py-2 rounded-xl text-sm" onKeyDown={e=>e.key==='Enter'&&authorizeUser()}/><button onClick={authorizeUser} className="btn-primary px-6 py-2 rounded-xl text-sm font-display font-semibold">Authorize</button></div><div className="space-y-2">{users.map(u=><div key={u.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0"><div><p className="font-body text-sm text-brand-text">{u.email}</p><p className="font-mono text-xs text-brand-text-muted">{u.generation_count||0} gens{u.is_admin?' · Admin':''}</p></div>{u.is_authorized?<span className="text-brand-green text-xs font-mono px-2 py-1 bg-brand-green/10 rounded-lg border border-brand-green/30">✓ Authorized</span>:<button onClick={()=>supabase.from('profiles').update({is_authorized:true}).eq('id',u.id).then(loadData)} className="text-xs font-mono px-3 py-1 bg-brand-purple/20 text-brand-purple-light rounded-lg border border-brand-purple/30">Authorize</button>}</div>)}</div></div>}
        {tab==='gens'&&<div className="card p-5 space-y-2">{generations.filter(g=>g.status==='complete').map(g=><div key={g.id} className="flex items-center gap-3 py-2 border-b border-brand-border last:border-0"><span className="font-mono text-xs text-brand-green">✓</span><span className="font-body text-sm text-brand-text flex-1 truncate">{g.prompt}</span><span className="font-mono text-xs text-brand-cyan">{g.output_metadata?.qualityScore||85}</span><span className="font-mono text-xs text-brand-text-dim">{new Date(g.created_at).toLocaleDateString()}</span></div>)}</div>}
        {tab==='failed'&&<div className="card p-5 space-y-2">{generations.filter(g=>g.status==='failed').length===0?<p className="text-center text-brand-text-muted py-8 font-body">No failed generations 🎉</p>:generations.filter(g=>g.status==='failed').map(g=><div key={g.id} className="py-2 border-b border-brand-border last:border-0"><p className="font-body text-sm text-brand-text">{g.prompt}</p><p className="font-mono text-xs text-brand-red mt-1">{g.system_type} · {new Date(g.created_at).toLocaleString()}</p></div>)}</div>}
        {tab==='scripts'&&<div className="card p-5 space-y-2">{scripts.map(s=><div key={s.id} className="flex items-center gap-3 py-2 border-b border-brand-border last:border-0"><span className="font-body text-sm text-brand-text flex-1">{s.name}</span><span className="font-mono text-xs text-brand-cyan">Q:{s.quality_score}</span><span className="font-mono text-xs text-brand-text-dim">×{s.usage_count}</span></div>)}</div>}
        {tab==='waitlist'&&<div className="card p-5 space-y-2">{waitlist.length===0?<p className="text-center text-brand-text-muted py-8 font-body">Waitlist empty</p>:waitlist.map(w=><div key={w.id} className="flex items-center gap-3 py-2 border-b border-brand-border last:border-0"><span className="font-body text-sm text-brand-text flex-1">{w.email}</span><span className="font-mono text-xs text-brand-text-dim">{new Date(w.added_at).toLocaleDateString()}</span></div>)}</div>}
      </div>
    </main>
  )
}

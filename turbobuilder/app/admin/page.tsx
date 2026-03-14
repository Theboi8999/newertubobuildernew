'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Analytics {
  totalGenerations: number; avgQualityScore: number
  qualityTrend: { date: string; avg_score: number }[]
  topPrompts: { prompt: string; count: number; avg_score: number }[]
  failedGenerations: { prompt: string; score: number; system_type: string; created_at: string }[]
  systemBreakdown: { system_type: string; count: number; avg_score: number }[]
  dailyGenerations: { date: string; count: number }[]
  scriptLibrarySize: number; newScriptsThisWeek: number
}

function BarChart({ data, vKey, max, color }: { data: any[]; vKey: string; max: number; color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-20">
      {data.map((d, i) => {
        const val = d[vKey] || 0
        const pct = max > 0 ? (val / max) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-card border border-brand-border text-xs font-mono px-2 py-1 rounded-lg hidden group-hover:block whitespace-nowrap z-10 shadow-card">
              {d.date?.slice(5)}: {val}
            </div>
            <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max(pct, 3)}%`, background: color, opacity: 0.6 + (pct/100)*0.4 }} />
          </div>
        )
      })}
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview'|'quality'|'scripts'|'failed'>('overview')

  useEffect(() => { checkAdmin() }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!p?.is_admin) { router.push('/dashboard'); return }
    const res = await fetch('/api/analytics')
    const data = await res.json()
    setAnalytics(data)
    setLoading(false)
  }

  if (loading) return <main className="min-h-screen bg-brand-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin"/></main>
  if (!analytics) return null

  const maxD = Math.max(...analytics.dailyGenerations.map(d=>d.count), 1)
  const sc = analytics.avgQualityScore
  const scColor = sc>=80?'text-brand-green':sc>=65?'text-brand-orange':'text-brand-red'
  const sysColors: Record<string,string> = { builder:'#6C3AED', modeling:'#00D4FF', project:'#00FF88' }

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-brand-border/50 backdrop-blur-xl bg-brand-bg/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-brand-text-muted hover:text-brand-text transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </a>
            <span className="font-display font-bold text-brand-text">Admin Analytics</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-brand-red/20 text-brand-red border border-brand-red/30">ADMIN</span>
          </div>
          <div className="flex gap-2">
            <a href="/admin/library" className="px-3 py-1.5 rounded-lg text-xs font-mono border border-brand-border text-brand-text-muted hover:text-brand-text hover:border-brand-purple/30 transition-all">📚 Scripts</a>
            <button onClick={()=>checkAdmin()} className="px-3 py-1.5 rounded-lg text-xs font-mono border border-brand-border text-brand-text-muted hover:text-brand-text transition-all">↻ Refresh</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label:'Total Generations', value:analytics.totalGenerations.toLocaleString(), sub:'all time', color:'text-brand-text' },
            { label:'Avg Quality', value:`${sc}/100`, sub:'across all gens', color:scColor },
            { label:'Script Library', value:analytics.scriptLibrarySize, sub:`+${analytics.newScriptsThisWeek} this week`, color:'text-brand-purple-light' },
            { label:'Failed Gens', value:analytics.failedGenerations.length, sub:'score < 60', color:analytics.failedGenerations.length>0?'text-brand-orange':'text-brand-green' },
          ].map(s=>(
            <div key={s.label} className="card p-5">
              <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`font-display font-black text-3xl mb-1 ${s.color}`}>{s.value}</p>
              <p className="font-body text-xs text-brand-text-muted">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-brand-surface border border-brand-border mb-6 w-fit">
          {[{id:'overview',l:'📊 Overview'},{id:'quality',l:'🎯 Quality'},{id:'scripts',l:'📚 Scripts'},{id:'failed',l:'⚠️ Failed'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${tab===t.id?'bg-brand-purple text-white':'text-brand-text-muted hover:text-brand-text'}`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab==='overview'&&(
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-display font-bold text-brand-text mb-1">Daily Generations</h3>
              <p className="font-body text-xs text-brand-text-muted mb-4">Last 14 days</p>
              <BarChart data={analytics.dailyGenerations} vKey="count" max={maxD} color="#6C3AED"/>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-xs text-brand-text-dim">{analytics.dailyGenerations[0]?.date?.slice(5)}</span>
                <span className="font-mono text-xs text-brand-text-dim">{analytics.dailyGenerations[analytics.dailyGenerations.length-1]?.date?.slice(5)}</span>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold text-brand-text mb-4">System Breakdown</h3>
              <div className="space-y-3">
                {analytics.systemBreakdown.map(s=>(
                  <div key={s.system_type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{background:sysColors[s.system_type]||'#888'}}/>
                        <span className="font-mono text-xs text-brand-text capitalize">{s.system_type}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-mono text-xs text-brand-text-dim">{s.count} gens</span>
                        <span className={`font-display font-bold text-xs ${s.avg_score>=80?'text-brand-green':s.avg_score>=65?'text-brand-orange':'text-brand-red'}`}>{s.avg_score}/100</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${analytics.totalGenerations>0?(s.count/analytics.totalGenerations)*100:0}%`,background:sysColors[s.system_type]||'#888'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-display font-bold text-brand-text mb-4">Top Prompts</h3>
              <div className="space-y-2">
                {analytics.topPrompts.slice(0,8).map((p,i)=>(
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-brand-surface border border-brand-border">
                    <span className="font-display font-black text-brand-text-dim w-5 text-center">{i+1}</span>
                    <p className="font-body text-sm text-brand-text-muted flex-1 truncate">{p.prompt}</p>
                    <span className="font-mono text-xs text-brand-text-dim flex-shrink-0">{p.count}×</span>
                    <span className={`font-display font-bold text-xs flex-shrink-0 ${p.avg_score>=80?'text-brand-green':p.avg_score>=65?'text-brand-orange':'text-brand-red'}`}>{p.avg_score}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='quality'&&(
          <div className="card p-6">
            <h3 className="font-display font-bold text-brand-text mb-1">Quality Trend</h3>
            <p className="font-body text-xs text-brand-text-muted mb-6">14-day average quality score</p>
            <div className="relative pb-2">
              <BarChart data={analytics.qualityTrend} vKey="avg_score" max={100} color="#00FF88"/>
              <div className="absolute w-full border-t border-dashed border-brand-orange/50 pointer-events-none" style={{bottom:'75%'}}>
                <span className="absolute right-0 -top-4 font-mono text-xs text-brand-orange bg-brand-bg px-1">75</span>
              </div>
            </div>
            <div className="flex justify-between mt-1 mb-4">
              <span className="font-mono text-xs text-brand-text-dim">{analytics.qualityTrend[0]?.date?.slice(5)}</span>
              <span className="font-mono text-xs text-brand-text-dim">{analytics.qualityTrend[analytics.qualityTrend.length-1]?.date?.slice(5)}</span>
            </div>
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
              <p className="font-mono text-xs text-brand-text-dim mb-1">Current: <span className={`font-bold ${scColor}`}>{sc}/100</span></p>
              <p className="font-body text-xs text-brand-text-muted">
                {sc>=80?'✅ Excellent — knowledge base performing well.':sc>=65?'⚠️ Good — review failure patterns to improve.':'❌ Needs work — check failed generations tab.'}
              </p>
            </div>
          </div>
        )}

        {tab==='scripts'&&(
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card p-5"><p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">Library Size</p><p className="font-display font-black text-3xl text-brand-purple-light mb-1">{analytics.scriptLibrarySize}</p><p className="font-body text-xs text-brand-text-muted">unique scripts stored</p></div>
              <div className="card p-5"><p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">New This Week</p><p className="font-display font-black text-3xl text-brand-cyan mb-1">+{analytics.newScriptsThisWeek}</p><p className="font-body text-xs text-brand-text-muted">auto-generated & saved</p></div>
              <div className="card p-5 flex items-center justify-center"><a href="/admin/library" className="btn-primary px-6 py-3 rounded-xl text-sm font-display font-semibold">Browse Full Library →</a></div>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold text-brand-text mb-3">How It Works</h3>
              <p className="font-body text-sm text-brand-text-muted leading-relaxed mb-4">When TurboBuilder encounters a scripting concept not in its knowledge base, it generates a complete Luau script, saves it here, and uses it immediately. Future requests retrieve from library in milliseconds.</p>
              <div className="grid grid-cols-3 gap-3">
                {[{l:'Instant retrieval',d:'Cached scripts load in <100ms'},{l:'Self-improving',d:'Higher quality replaces lower'},{l:'Version history',d:'Old code saved before updates'}].map(x=>(
                  <div key={x.l} className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                    <p className="font-display font-semibold text-brand-text text-sm mb-1">{x.l}</p>
                    <p className="font-body text-xs text-brand-text-muted">{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='failed'&&(
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-orange/5 border border-brand-orange/20">
              <p className="font-body text-sm text-brand-text-muted">Generations that scored below 60/100. Review to identify knowledge base gaps.</p>
            </div>
            {analytics.failedGenerations.length===0?(
              <div className="card p-12 text-center"><p className="text-4xl mb-4">✅</p><p className="font-display font-bold text-brand-text mb-2">No failed generations</p><p className="font-body text-sm text-brand-text-muted">All recent gens scored above 60.</p></div>
            ):(
              analytics.failedGenerations.map((f,i)=>(
                <div key={i} className="card p-4 border-brand-red/20">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-body text-sm text-brand-text flex-1">{f.prompt}</p>
                    <div className="flex items-end gap-1 flex-shrink-0"><span className={`font-display font-black text-xl ${f.score>=50?'text-brand-orange':'text-brand-red'}`}>{f.score}</span><span className="font-mono text-xs text-brand-text-dim mb-0.5">/100</span></div>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-xs text-brand-text-dim capitalize px-2 py-0.5 rounded bg-brand-surface border border-brand-border">{f.system_type}</span>
                    <span className="font-mono text-xs text-brand-text-dim">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  )
}

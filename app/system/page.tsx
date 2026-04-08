'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SYSTEMS, type SystemType } from '@/lib/utils'

interface Generation {
  id: string; status: string; progress: number; spec_items: any[]
  output_url: string | null; output_metadata: any; prompt: string
  system_type: string; created_at: string
}

const STYLES = [
  { id: 'modern', label: 'Modern', color: '#00D4FF' },
  { id: 'victorian', label: 'Victorian', color: '#C4A35A' },
  { id: 'industrial', label: 'Industrial', color: '#8B7355' },
  { id: 'brutalist', label: 'Brutalist', color: '#888888' },
  { id: 'colonial', label: 'Colonial', color: '#7CB87C' },
  { id: 'derelict', label: 'Derelict', color: '#FF6B35' },
  { id: 'coastal', label: 'Coastal', color: '#00BFFF' },
  { id: 'scandinavian', label: 'Scandi', color: '#DDDDDD' },
]

const SCALES = [
  { id: 'small', label: 'Small', desc: 'Studio/kiosk' },
  { id: 'medium', label: 'Medium', desc: 'House/car' },
  { id: 'large', label: 'Large', desc: 'Block/truck' },
  { id: 'massive', label: 'Massive', desc: 'Stadium/map' },
]

const WIZARD_QUESTIONS: Record<string, { q: string; options: string[] }[]> = {
  builder: [
    { q: 'Building type?', options: ['Police Station', 'Hospital', 'Fire Station', 'Government', 'Apartment Block', 'Shop', 'Warehouse'] },
    { q: 'Country style?', options: ['UK/British', 'Australian', 'American', 'European', 'Generic'] },
    { q: 'Interior?', options: ['Full interior', 'Partial interior', 'Exterior only'] },
    { q: 'Special features?', options: ['Parking garage', 'Rooftop', 'Basement', 'None'] },
  ],
  modeling: [
    { q: 'Vehicle type?', options: ['Police Car', 'Fire Truck', 'Ambulance', 'Helicopter', 'Civilian Car', 'Motorbike', 'Military'] },
    { q: 'Livery?', options: ['NSW Police', 'UK Police', 'US Police', 'Fire/EMS', 'Unmarked', 'Custom'] },
    { q: 'Scripting?', options: ['Full ELS + scripts', 'ELS lights only', 'No scripts'] },
    { q: 'Special gear?', options: ['Weapon mounts', 'Air support', 'Medical bay', 'None'] },
  ],
  project: [
    { q: 'Map type?', options: ['City district', 'Rural town', 'Industrial zone', 'Coastal', 'Vehicle pack', 'Building pack'] },
    { q: 'Scale?', options: ['1-2 blocks', '4-6 blocks', 'Full district'] },
    { q: 'Atmosphere?', options: ['Day', 'Night', 'Both (day/night)'] },
    { q: 'Theme?', options: ['Police/emergency', 'Criminal', 'Military', 'Civilian'] },
  ],
}

// Isometric 3D canvas preview
function ThreeDPreview({ url }: { url: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()

  useEffect(() => {
    if (!url || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    let angle = 0

    const blocks = Array.from({ length: 14 }, () => ({
      x: (Math.random() - 0.5) * 130, y: Math.random() * 70,
      z: (Math.random() - 0.5) * 130,
      w: 12 + Math.random() * 32, h: 15 + Math.random() * 65, d: 12 + Math.random() * 32,
      hue: 195 + Math.random() * 70,
    }))

    function iso(x: number, y: number, z: number) {
      return { sx: (x - z) * 0.866, sy: (x + z) * 0.5 - y }
    }

    function block(cx: number, cy: number, bx: number, by: number, bz: number, bw: number, bh: number, bd: number, hue: number) {
      const pts = (dx: number, dy: number, dz: number) => iso(bx + dx, by + dy, bz + dz)
      const TL = pts(0,bh,0); const TR = pts(bw,bh,0); const BR = pts(bw,bh,bd); const BL = pts(0,bh,bd)
      const TLt = pts(0,0,0); const TRt = pts(bw,0,0); const BRt = pts(bw,0,bd); const BLt = pts(0,0,bd)
      const p = (pt: {sx:number;sy:number}) => [cx+pt.sx, cy+pt.sy] as [number,number]

      // top
      ctx.beginPath(); [TLt,TRt,BRt,BLt].forEach((pt,i) => { const [x,y]=p(pt); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y) }); ctx.closePath()
      ctx.fillStyle = `hsl(${hue},38%,32%)`; ctx.fill()
      // right
      ctx.beginPath(); [TRt,TR,BR,BRt].forEach((pt,i) => { const [x,y]=p(pt); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y) }); ctx.closePath()
      ctx.fillStyle = `hsl(${hue},32%,19%)`; ctx.fill()
      // left
      ctx.beginPath(); [TLt,TL,BL,BLt].forEach((pt,i) => { const [x,y]=p(pt); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y) }); ctx.closePath()
      ctx.fillStyle = `hsl(${hue},38%,24%)`; ctx.fill()

      // window glows on tall blocks
      if (bh > 40) {
        ctx.fillStyle = `hsla(${hue+20},80%,75%,0.25)`
        for (let wy = by+10; wy < by+bh-10; wy += 15) {
          const wTL = iso(bx+bw, wy+4, bz+2)
          ctx.fillRect(cx+wTL.sx-3, cy+wTL.sy-3, 6, 4)
        }
      }
    }

    function draw() {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.6)
      g.addColorStop(0, '#0F1320'); g.addColorStop(1, '#05080F')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

      // grid
      ctx.strokeStyle = 'rgba(108,58,237,0.12)'; ctx.lineWidth = 0.8
      for (let i=-8;i<=8;i++) {
        const a=iso(i*18,0,-144), b=iso(i*18,0,144)
        ctx.beginPath(); ctx.moveTo(W/2+a.sx,H/2+90+a.sy); ctx.lineTo(W/2+b.sx,H/2+90+b.sy); ctx.stroke()
        const c=iso(-144,0,i*18), d=iso(144,0,i*18)
        ctx.beginPath(); ctx.moveTo(W/2+c.sx,H/2+90+c.sy); ctx.lineTo(W/2+d.sx,H/2+90+d.sy); ctx.stroke()
      }

      const rotated = blocks.map(b => {
        const rx = b.x*Math.cos(angle)-b.z*Math.sin(angle)
        const rz = b.x*Math.sin(angle)+b.z*Math.cos(angle)
        return {...b, x:rx, z:rz}
      })
      rotated.sort((a,b) => (b.x+b.z)-(a.x+a.z))
      rotated.forEach(b => block(W/2, H/2+90, b.x, b.y, b.z, b.w, b.h, b.d, b.hue))

      angle += 0.004
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [url])

  if (!url) return null
  return (
    <div className="relative rounded-2xl overflow-hidden border border-brand-border">
      <canvas ref={canvasRef} width={540} height={300} className="w-full" />
      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <span className="font-mono text-xs text-brand-purple-light bg-brand-bg/80 backdrop-blur-sm px-3 py-1 rounded-full border border-brand-purple/20">
          3D PREVIEW · Rotating isometric render
        </span>
      </div>
    </div>
  )
}

function MapsModal({ onSelect, onClose }: { onSelect: (addr: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!q.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    setResults([`${q}, Sydney NSW, Australia`, `${q}, London, United Kingdom`, `${q}, New York, USA`])
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-brand-text">Real-World Reference</h3>
          <button onClick={onClose} className="text-brand-text-dim hover:text-brand-text w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-surface">✕</button>
        </div>
        <p className="font-body text-xs text-brand-text-muted mb-4">Search for a real location to use as style/layout inspiration.</p>
        <div className="flex gap-2 mb-4">
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key==='Enter'&&search()}
            placeholder="e.g. NSW Police Headquarters" className="input flex-1 px-3 py-2 rounded-xl text-sm" />
          <button onClick={search} className="btn-primary px-4 py-2 rounded-xl text-sm min-w-[70px]">
            {loading ? '...' : 'Search'}
          </button>
        </div>
        {results.map(r => (
          <button key={r} onClick={() => { onSelect(r); onClose() }}
            className="w-full text-left p-3 rounded-xl border border-brand-border hover:border-brand-cyan/40 text-sm text-brand-text-muted hover:text-brand-text transition-all font-body mb-2 flex items-center gap-2">
            <span className="text-brand-cyan">📍</span> {r}
          </button>
        ))}
      </div>
    </div>
  )
}

function SystemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const systemType = (searchParams.get('type') || 'builder') as SystemType
  const existingGenId = searchParams.get('generationId')
  const supabase = createClient()
  const sys = SYSTEMS[systemType]

  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [history, setHistory] = useState<Generation[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [style, setStyle] = useState('')
  const [scale, setScale] = useState('medium')
  const [variations, setVariations] = useState(1)
  const [locationRef, setLocationRef] = useState('')
  const [showMaps, setShowMaps] = useState(false)
  const [tab, setTab] = useState<'prompt'|'wizard'|'fix'>('prompt')
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({})
  const [criticism, setCriticism] = useState('')
  const [activeVar, setActiveVar] = useState(0)
  const pollRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (existingGenId) loadGeneration(existingGenId)
      loadHistory()
    }
    init()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [existingGenId, systemType])






  async function loadHistory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('generations').select('*')
      .eq('user_id', user.id).eq('system_type', systemType).eq('status','complete')
      .order('created_at', { ascending: false }).limit(5)
    setHistory(data || [])
  }

  async function loadGeneration(id: string) {
    const { data } = await supabase.from('generations').select('*').eq('id', id).single()
    if (data) {
      setGeneration(data); setPrompt(data.prompt)
      if (!['complete','failed'].includes(data.status)) startPolling(id)
    }
  }

  function startPolling(id: string) {
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('generations').select('*').eq('id', id).single()
      if (!data) return
      setGeneration(data)
      const msgs: Record<string,string> = {
        queued: '⏳ Queued…', researching: '🔬 Research bot scanning…',
        generating: '⚡ Generating at prestige quality…', validating: '🔍 Validating…',
        complete: '🎉 Complete!', failed: '❌ Failed.',
      }
      setStatusMsg(msgs[data.status] || '')
      if (['complete','failed'].includes(data.status)) { clearInterval(pollRef.current); loadHistory() }
    }, 2000)
  }

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemType, style: style||undefined, scale, locationReference: locationRef?{address:locationRef}:undefined, variations }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      await loadGeneration(data.generationId)
      router.push(`/system?type=${systemType}&generationId=${data.generationId}`)
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  async function buildWizardPrompt() {
    const res = await fetch('/api/wizard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: wizardAnswers, systemType }),
    })
    const data = await res.json()
    if (data.prompt) { setPrompt(data.prompt); setTab('prompt') }
  }

  async function applyFix() {
    if (!criticism.trim() || !generation) return
    const res = await fetch('/api/criticise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalPrompt: prompt, criticism, systemType }),
    })
    const data = await res.json()
    if (data.improvedPrompt) { setPrompt(data.improvedPrompt); setCriticism(''); setTab('prompt') }
  }

  const isGenerating = generation && !['complete','failed'].includes(generation.status)
  const meta = generation?.output_metadata || {}
  const hasVariations = meta.variations?.length > 0
  const score = meta.qualityScore
  const scoreColor = score >= 80 ? 'text-brand-green' : score >= 65 ? 'text-brand-orange' : 'text-brand-red'

  return (
    <main className="min-h-screen bg-brand-bg">
      {showMaps && <MapsModal onSelect={setLocationRef} onClose={() => setShowMaps(false)} />}

      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-brand-border/50 backdrop-blur-xl bg-brand-bg/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-brand-text-muted hover:text-brand-text transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </a>
            <span className="text-xl">{sys.icon}</span>
            <span className="font-display font-semibold text-brand-text">{sys.label}</span>
          </div>
          <div className="flex gap-2">
            {Object.values(SYSTEMS).map(s => (
              <a key={s.id} href={`/system?type=${s.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${s.id===systemType?'text-white':'text-brand-text-dim hover:text-brand-text'}`}
                style={s.id===systemType?{background:`${s.color}20`,border:`1px solid ${s.color}40`,color:s.colorLight}:{}}>
                {s.badge}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">

          {/* ── LEFT ── */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex p-1 rounded-xl bg-brand-surface border border-brand-border gap-1">
              {[{id:'prompt',label:'✏️ Prompt'},{id:'wizard',label:'🧙 Wizard'},{id:'fix',label:'🔧 Fix It'}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id as any)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all ${tab===t.id?'bg-brand-purple text-white':'text-brand-text-muted hover:text-brand-text'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab==='prompt' && (
              <div className="card p-5 space-y-3">
                <div>
                  <h2 className="font-display font-bold text-brand-text mb-0.5">Describe Your Asset</h2>
                  <p className="font-body text-xs text-brand-text-muted">{sys.description}</p>
                </div>
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
                  placeholder={`e.g. ${sys.examples[0]}`} rows={4}
                  className="input w-full px-4 py-3 rounded-xl text-sm resize-none" disabled={!!isGenerating}/>
                <button onClick={()=>setShowMaps(true)}
                  className="flex items-center gap-2 text-xs text-brand-text-muted hover:text-brand-cyan border border-brand-border hover:border-brand-cyan/40 px-3 py-2 rounded-xl transition-all font-mono w-full">
                  <span>📍</span>
                  <span className="truncate">{locationRef||'Add real-world reference…'}</span>
                  {locationRef&&<button onClick={e=>{e.stopPropagation();setLocationRef('')}} className="ml-auto text-brand-text-dim hover:text-brand-red">✕</button>}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {sys.examples.slice(0,4).map(ex=>(
                    <button key={ex} onClick={()=>setPrompt(ex)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-brand-border text-brand-text-dim hover:border-brand-purple/40 hover:text-brand-text transition-all font-body">
                      {ex}
                    </button>
                  ))}
                </div>
                {error&&<div className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs">{error}</div>}
                <button onClick={handleGenerate} disabled={loading||!!isGenerating||!prompt.trim()}
                  className="btn-primary w-full py-3 rounded-xl text-sm font-display font-semibold">
                  {loading?'Starting…':isGenerating?'Generating…':`Generate ${sys.label} →`}
                </button>
              </div>
            )}

            {tab==='wizard' && (
              <div className="card p-5 space-y-4">
                <div>
                  <h2 className="font-display font-bold text-brand-text mb-0.5">Prompt Wizard</h2>
                  <p className="font-body text-xs text-brand-text-muted">Answer questions, get a perfect prompt.</p>
                </div>
                {(WIZARD_QUESTIONS[systemType]||[]).map((q,i)=>(
                  <div key={i}>
                    <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">{q.q}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map(opt=>(
                        <button key={opt} onClick={()=>setWizardAnswers(p=>({...p,[q.q]:opt}))}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all font-body ${wizardAnswers[q.q]===opt?'bg-brand-purple/20 border-brand-purple/60 text-brand-purple-light':'border-brand-border text-brand-text-dim hover:border-brand-purple/30 hover:text-brand-text'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={buildWizardPrompt} className="btn-primary w-full py-3 rounded-xl text-sm">Build My Prompt →</button>
              </div>
            )}

            {tab==='fix' && (
              <div className="card p-5 space-y-3">
                <div>
                  <h2 className="font-display font-bold text-brand-text mb-0.5">Fix Last Generation</h2>
                  <p className="font-body text-xs text-brand-text-muted">Describe what was wrong. AI will improve the prompt.</p>
                </div>
                {generation&&(
                  <div className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                    <p className="font-mono text-xs text-brand-text-dim mb-1">Last prompt</p>
                    <p className="font-body text-xs text-brand-text-muted line-clamp-2">{generation.prompt}</p>
                  </div>
                )}
                <textarea value={criticism} onChange={e=>setCriticism(e.target.value)}
                  placeholder="e.g. The windows were too small, no parking, wrong colour…" rows={4}
                  className="input w-full px-4 py-3 rounded-xl text-sm resize-none"/>
                <button onClick={applyFix} disabled={!criticism.trim()||!generation} className="btn-primary w-full py-3 rounded-xl text-sm">
                  Fix & Re-generate →
                </button>
              </div>
            )}

            {/* Style */}
            <div className="card p-4">
              <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-3">Style</p>
              <div className="grid grid-cols-4 gap-1.5">
                {STYLES.map(s=>(
                  <button key={s.id} onClick={()=>setStyle(style===s.id?'':s.id)}
                    className={`py-2 rounded-xl border text-xs font-body transition-all text-center ${style===s.id?'text-white':'border-brand-border text-brand-text-dim hover:text-brand-text'}`}
                    style={style===s.id?{background:`${s.color}22`,borderColor:`${s.color}55`,color:s.color}:{}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale + Variations */}
            <div className="card p-4 space-y-4">
              <div>
                <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-3">Scale</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {SCALES.map(s=>(
                    <button key={s.id} onClick={()=>setScale(s.id)}
                      className={`py-2 rounded-xl border text-xs transition-all text-center ${scale===s.id?'bg-brand-cyan/15 border-brand-cyan/50 text-brand-cyan-light':'border-brand-border text-brand-text-dim hover:text-brand-text'}`}>
                      <div className="font-display font-semibold">{s.label}</div>
                      <div className="text-brand-text-dim text-[10px] font-body">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">
                  Variations: <span className="text-brand-text">{variations}</span>
                </p>
                <input type="range" min={1} max={3} value={variations} onChange={e=>setVariations(Number(e.target.value))}
                  className="w-full accent-brand-purple"/>
              </div>
            </div>

            {/* History */}
            {history.length>0&&(
              <div className="card p-4">
                <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-3">Recent</p>
                <div className="space-y-2">
                  {history.map(h=>(
                    <button key={h.id}
                      onClick={()=>{setGeneration(h);setPrompt(h.prompt);router.push(`/system?type=${systemType}&generationId=${h.id}`)}}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${h.id===generation?.id?'border-brand-purple/40 bg-brand-purple/10':'border-brand-border hover:border-brand-border/80'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-brand-text-dim">{new Date(h.created_at).toLocaleDateString()}</span>
                        <span className={`font-display font-bold text-xs ${(h.output_metadata?.qualityScore||0)>=80?'text-brand-green':'text-brand-orange'}`}>
                          {h.output_metadata?.qualityScore||'–'}/100
                        </span>
                      </div>
                      <p className="font-body text-xs text-brand-text-muted line-clamp-2">{h.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">
            {/* Status */}
            {generation&&(
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-brand-text">Status</h3>
                  <span className={`font-mono text-xs uppercase px-2 py-1 rounded-lg border ${generation.status==='complete'?'text-brand-green border-brand-green/30 bg-brand-green/10':generation.status==='failed'?'text-brand-red border-brand-red/30 bg-brand-red/10':'text-brand-cyan border-brand-cyan/30 bg-brand-cyan/10'}`}>
                    {generation.status}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all duration-700 ${generation.status==='complete'?'bg-brand-green':generation.status==='failed'?'bg-brand-red':'progress-bar'}`}
                    style={{width:`${generation.progress||0}%`}}/>
                </div>
                {statusMsg&&<p className="font-body text-xs text-brand-text-muted">{statusMsg}</p>}
                {meta.newScriptsGenerated?.length>0&&(
                  <div className="mt-3 p-3 rounded-xl bg-brand-purple/10 border border-brand-purple/30">
                    <p className="font-mono text-xs text-brand-purple-light">✨ {meta.newScriptsGenerated.length} new script{meta.newScriptsGenerated.length>1?'s':''} saved to library</p>
                    <p className="font-body text-xs text-brand-text-dim mt-0.5">{meta.newScriptsGenerated.join(', ')}</p>
                  </div>
                )}
                {meta.validationWarnings?.length>0&&(
                  <div className="mt-3 p-3 rounded-xl bg-brand-orange/10 border border-brand-orange/30">
                    <p className="font-mono text-xs text-brand-orange mb-1">⚠️ Warnings</p>
                    {meta.validationWarnings.map((w:string,i:number)=><p key={i} className="font-body text-xs text-brand-text-muted">{w}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* 3D Preview */}
            {generation?.status==='complete'&&generation.output_url&&(
              <ThreeDPreview url={generation.output_url}/>
            )}

            {/* Variation tabs */}
            {generation?.status==='complete'&&hasVariations&&(
              <div className="flex gap-2">
                {[{score:score,label:'Original'},...(meta.variations||[]).map((v:any,i:number)=>({score:v.qualityScore,label:`Variation ${i+1}`}))].map((v,i)=>(
                  <button key={i} onClick={()=>setActiveVar(i)}
                    className={`px-3 py-2 rounded-xl border text-xs font-mono transition-all ${activeVar===i?'bg-brand-purple/20 border-brand-purple/60 text-brand-purple-light':'border-brand-border text-brand-text-dim hover:text-brand-text'}`}>
                    {v.label} <span className={`font-bold ${(v.score||0)>=80?'text-brand-green':'text-brand-orange'}`}>{v.score}/100</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quality + Spec */}
            {generation?.status==='complete'&&(
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-brand-text">Quality Report</h3>
                  <div className="flex items-end gap-1">
                    <span className={`font-display font-black text-3xl ${scoreColor}`}>{score||'–'}</span>
                    <span className="text-brand-text-dim font-mono text-sm mb-1">/100</span>
                  </div>
                </div>
                {score&&(
                  <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden mb-4">
                    <div className={`h-full rounded-full transition-all ${score>=80?'bg-brand-green':score>=65?'bg-brand-orange':'bg-brand-red'}`} style={{width:`${score}%`}}/>
                  </div>
                )}

                {generation.spec_items?.length>0&&(
                  <div className="mb-4">
                    <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-2">Asset Spec</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {generation.spec_items.map((item:any,i:number)=>(
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-brand-surface border border-brand-border">
                          <span className="font-body text-xs text-brand-text-muted">{item.label}</span>
                          <span className="font-mono text-xs text-brand-text-dim">{item.count}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {meta.qualityNotes&&(
                  <div className="mb-4 p-3 rounded-xl bg-brand-surface border border-brand-border">
                    <p className="font-mono text-xs text-brand-text-dim mb-1">Quality Notes</p>
                    <p className="font-body text-xs text-brand-text-muted">{meta.qualityNotes}</p>
                  </div>
                )}

                {meta.enhancedPrompt&&meta.enhancedPrompt!==generation.prompt&&(
                  <div className="mb-4 p-3 rounded-xl bg-brand-surface border border-brand-border">
                    <p className="font-mono text-xs text-brand-text-dim mb-1">Enhanced prompt used</p>
                    <p className="font-body text-xs text-brand-text-muted">{meta.enhancedPrompt}</p>
                  </div>
                )}

                <div className="flex items-center gap-1 mb-4">
                  <p className="font-mono text-xs text-brand-text-dim mr-2">Rate:</p>
                  {[1,2,3,4,5].map(r=>(
                    <button key={r} onClick={async()=>{await supabase.from('generations').update({rating:r}).eq('id',generation.id)}}
                      className="text-xl hover:scale-125 transition-transform">⭐</button>
                  ))}
                </div>

                {generation.output_url&&(
                  <a href={generation.output_url} download className="btn-primary w-full py-3 rounded-xl text-sm font-display font-semibold text-center block">
                    ⬇ Download .rbxmx →
                  </a>
                )}
              </div>
            )}

            {/* Import instructions */}
            {generation?.status==='complete'&&(
              <div className="card p-5">
                <h3 className="font-display font-bold text-brand-text mb-4">Import to Studio</h3>
                <div className="space-y-3">
                  {[
                    {n:1,t:'Download .rbxmx',d:'Click the Download button above.'},
                    {n:2,t:'Open Roblox Studio',d:'Launch Studio and open your game.'},
                    {n:3,t:'Drag & drop to import',d:'Drag the file into the Explorer window.'},
                    {n:4,t:'Position & test',d:'Model imports with all scripts attached, ready to go.'},
                  ].map(s=>(
                    <div key={s.n} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center flex-shrink-0">
                        <span className="font-display font-bold text-brand-purple-light text-xs">{s.n}</span>
                      </div>
                      <div>
                        <p className="font-display font-semibold text-brand-text text-sm">{s.t}</p>
                        <p className="font-body text-xs text-brand-text-muted">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!generation&&(
              <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[420px]">
                <div className="text-7xl mb-6 animate-float">{sys.icon}</div>
                <h3 className="font-display font-bold text-2xl text-brand-text mb-3">{sys.label}</h3>
                <p className="font-body text-sm text-brand-text-muted max-w-sm leading-relaxed mb-6">{sys.description}</p>
                <div className="grid gap-2 w-full max-w-xs">
                  {sys.examples.slice(0,3).map(ex=>(
                    <button key={ex} onClick={()=>setPrompt(ex)}
                      className="text-xs px-4 py-2.5 rounded-xl border border-brand-border text-brand-text-muted hover:border-brand-purple/40 hover:text-brand-text transition-all font-body text-left">
                      → {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SystemPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-brand-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin"/></main>}>
      <SystemPage/>
    </Suspense>
  )
}

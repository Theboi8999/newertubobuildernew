'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SceneAsset {
  name: string; type: 'builder'|'modeling'|'project'
  prompt: string; position: { x:number; y:number; z:number }; dependencies: string[]
}

interface ScenePlan {
  title: string; description: string
  assets: SceneAsset[]; sharedScripts: string[]
}

const SYS_COLORS: Record<string, string> = { builder:'#6C3AED', modeling:'#00D4FF', project:'#00FF88' }
const SYS_ICONS: Record<string, string> = { builder:'🏗️', modeling:'🚗', project:'🗺️' }

const EXAMPLE_SCENES = [
  'A police station with 3 patrol cars parked outside and 2 marked police SUVs in the back lot',
  'A hospital with 2 ambulances at the bay, a helipad on the roof, and staff accommodation blocks',
  'A city block with a bank, corner shop, 4-storey apartment building, and 8 civilian vehicles on street',
  'A fire station with a ladder truck, pumper, and 2 firefighter personal vehicles in the yard',
  'A military base with 3 armoured vehicles, a helicopter, a command building and guard post',
]

export default function ScenePage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<ScenePlan | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set())
  const [generating, setGenerating] = useState(false)

  async function buildPlan() {
    if (!prompt.trim()) return
    setLoading(true); setPlan(null)
    const res = await fetch('/api/scene', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    if (data.plan) {
      setPlan(data.plan)
      setSelectedAssets(new Set(data.plan.assets.map((_: any, i: number) => i)))
    }
    setLoading(false)
  }

  async function generateSelected() {
    if (!plan || selectedAssets.size === 0) return
    setGenerating(true)
    const assets = plan.assets.filter((_, i) => selectedAssets.has(i))
    // Generate each asset sequentially
    for (const asset of assets) {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: asset.prompt, systemType: asset.type }),
      })
      await res.json()
    }
    setGenerating(false)
    router.push('/dashboard')
  }

  const toggleAsset = (i: number) => {
    setSelectedAssets(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-brand-border/50 backdrop-blur-xl bg-brand-bg/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-brand-text-muted hover:text-brand-text transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </a>
            <span className="text-xl">🎬</span>
            <span className="font-display font-bold text-brand-text">Scene Builder</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-brand-green/15 text-brand-green border border-brand-green/30">BETA</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display font-black text-4xl text-brand-text mb-3">Multi-Asset Scene Builder</h1>
          <p className="font-body text-brand-text-muted max-w-xl mx-auto">
            Describe an entire scene — buildings, vehicles, everything. AI breaks it into individual assets and generates them all, coordinated together.
          </p>
        </div>

        {/* Input */}
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-brand-text mb-1">Describe Your Scene</h2>
          <p className="font-body text-xs text-brand-text-muted mb-3">Be specific about what's in the scene and how many of each thing.</p>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
            placeholder="e.g. A police station with 3 patrol cars outside, a sergeant's office building, and a processing centre…"
            rows={4} className="input w-full px-4 py-3 rounded-xl text-sm resize-none mb-3"/>
          <div className="flex flex-wrap gap-2 mb-4">
            {EXAMPLE_SCENES.map(ex=>(
              <button key={ex} onClick={()=>setPrompt(ex)}
                className="text-xs px-3 py-1.5 rounded-xl border border-brand-border text-brand-text-dim hover:border-brand-purple/40 hover:text-brand-text transition-all font-body">
                {ex.slice(0,45)}…
              </button>
            ))}
          </div>
          <button onClick={buildPlan} disabled={loading||!prompt.trim()}
            className="btn-primary px-8 py-3 rounded-xl text-sm font-display font-semibold">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
                Analysing scene…
              </span>
            ) : 'Analyse Scene →'}
          </button>
        </div>

        {/* Scene plan */}
        {plan && (
          <div className="space-y-4">
            {/* Plan header */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-brand-text text-xl mb-1">{plan.title}</h3>
                  <p className="font-body text-sm text-brand-text-muted">{plan.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-black text-3xl text-brand-text">{plan.assets.length}</div>
                  <div className="font-mono text-xs text-brand-text-dim">assets total</div>
                </div>
              </div>
              {plan.sharedScripts?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-border">
                  <p className="font-mono text-xs text-brand-text-dim mb-2">Shared systems needed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.sharedScripts.map(s=>(
                      <span key={s} className="text-xs px-2 py-1 rounded-lg bg-brand-purple/10 border border-brand-purple/30 text-brand-purple-light font-mono">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Asset grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plan.assets.map((asset, i) => (
                <div key={i}
                  onClick={() => toggleAsset(i)}
                  className={`card p-4 cursor-pointer transition-all ${selectedAssets.has(i)?'border-brand-purple/50 bg-brand-purple/8':'border-brand-border/60 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{SYS_ICONS[asset.type]}</span>
                      <div>
                        <p className="font-display font-semibold text-brand-text text-sm">{asset.name}</p>
                        <span className="text-xs font-mono capitalize" style={{color:SYS_COLORS[asset.type]}}>{asset.type}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedAssets.has(i)?'bg-brand-purple border-brand-purple':'border-brand-border'}`}>
                      {selectedAssets.has(i)&&<span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                  <p className="font-body text-xs text-brand-text-muted line-clamp-3 mb-3">{asset.prompt}</p>
                  {asset.dependencies?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.dependencies.map(d=>(
                        <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-text-dim font-mono">
                          needs: {d}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-brand-border grid grid-cols-3 gap-2 text-center">
                    <div><p className="font-mono text-xs text-brand-text-dim">X</p><p className="font-display font-semibold text-brand-text text-xs">{asset.position.x}</p></div>
                    <div><p className="font-mono text-xs text-brand-text-dim">Y</p><p className="font-display font-semibold text-brand-text text-xs">{asset.position.y}</p></div>
                    <div><p className="font-mono text-xs text-brand-text-dim">Z</p><p className="font-display font-semibold text-brand-text text-xs">{asset.position.z}</p></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generate button */}
            <div className="flex items-center justify-between p-5 rounded-2xl border border-brand-border bg-brand-surface">
              <div>
                <p className="font-display font-bold text-brand-text">{selectedAssets.size} of {plan.assets.length} assets selected</p>
                <p className="font-body text-xs text-brand-text-muted mt-0.5">Each will be generated at prestige quality with all scripts</p>
              </div>
              <button onClick={generateSelected} disabled={generating||selectedAssets.size===0}
                className="btn-primary px-8 py-3 rounded-xl text-sm font-display font-semibold">
                {generating?(
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
                    Generating…
                  </span>
                ):`Generate ${selectedAssets.size} Assets →`}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

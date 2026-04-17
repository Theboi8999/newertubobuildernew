'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SYSTEMS, STYLE_OPTIONS, SCALE_OPTIONS, qualityColor, qualityLabel } from '@/lib/utils'

type SystemId = keyof typeof SYSTEMS

const WIZARD_QUESTIONS: Record<SystemId, { q: string; placeholder: string }[]> = {
  builder: [
    { q: 'What type of building?', placeholder: 'Police station, fire station, hospital...' },
    { q: 'Which country or city style?', placeholder: 'UK, USA, Germany, generic...' },
    { q: 'Any special rooms or features?', placeholder: 'Full custody suite, helipad, gym...' },
    { q: 'Interior fully furnished?', placeholder: 'Yes, minimal, exterior only...' },
  ],
  modeling: [
    { q: 'What vehicle or tool?', placeholder: 'Police car, fire engine, helicopter, gun...' },
    { q: 'Which service or livery?', placeholder: 'Metropolitan Police, London Fire Brigade...' },
    { q: 'Special functions needed?', placeholder: 'ELS lights, working hose, prisoner seat...' },
    { q: 'Scripting detail level?', placeholder: 'Full scripts, basic, exterior only...' },
  ],
  project: [
    { q: 'What type of project?', placeholder: 'Full city map, emergency services pack...' },
    { q: 'Theme and setting?', placeholder: 'UK roleplay, US city, European...' },
    { q: 'Key features to include?', placeholder: 'Multiple stations, working traffic...' },
    { q: 'Scale?', placeholder: 'Small town, large city, single district...' },
  ],
}

function SystemPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const systemId = (params.get('system') || 'builder') as SystemId
  const watchId = params.get('generationId')

  const supabase = createClient()
  const sys = SYSTEMS[systemId] || SYSTEMS.builder

  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [scale, setScale] = useState('medium')
  const [locationRef, setLocationRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [generationId, setGenerationId] = useState<string | null>(watchId)
  const [generation, setGeneration] = useState<any>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({})
  const [wizardLoading, setWizardLoading] = useState(false)
  const [criticismMode, setCriticismMode] = useState(false)
  const [criticism, setCriticism] = useState('')
  const [criticiseLoading, setCriticiseLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
  }, [])

  useEffect(() => {
    if (generationId) startPolling(generationId)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [generationId])

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('generations').select('*').eq('id', id).single()
      if (data) {
        setGeneration(data)
        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(pollRef.current!)
        }
      }
    }, 2000)
  }

  async function handleGenerate() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setGeneration(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          systemType: systemId,
          style: style || undefined,
          scale,
          locationReference: locationRef || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setGenerationId(data.generationId)
      router.replace(`/system?system=${systemId}&generationId=${data.generationId}`)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleWizard() {
    const answers: Record<string, string> = {}
    for (const q of WIZARD_QUESTIONS[systemId] || []) {
      if (wizardAnswers[q.q]) answers[q.q] = wizardAnswers[q.q]
    }
    if (Object.keys(answers).length === 0) return
    setWizardLoading(true)
    try {
      const res = await fetch('/api/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, systemType: systemId }),
      })
      const data = await res.json()
      if (data.prompt) { setPrompt(data.prompt); setShowWizard(false) }
    } catch {}
    setWizardLoading(false)
  }

  async function handleCriticise() {
    if (!criticism.trim() || !generation) return
    setCriticiseLoading(true)
    try {
      const res = await fetch('/api/criticise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt: generation.prompt, criticism: criticism.trim(), systemType: systemId }),
      })
      const data = await res.json()
      if (data.improvedPrompt) {
        setPrompt(data.improvedPrompt)
        setCriticismMode(false)
        setCriticism('')
        setGenerationId(null)
        setGeneration(null)
        router.replace(`/system?system=${systemId}`)
      }
    } catch {}
    setCriticiseLoading(false)
  }

  const isActive = generation && !['complete', 'failed'].includes(generation.status)
  const isDone = generation?.status === 'complete'
  const isFailed = generation?.status === 'failed'

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-brand-text-muted hover:text-white transition-colors text-sm">← Dashboard</a>
            <div className="flex items-center gap-2">
              <span className="text-xl">{sys.icon}</span>
              <span className="font-bold text-white text-sm hidden sm:block">{sys.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {Object.values(SYSTEMS).filter(s => s.id !== systemId).map(s => (
              <a key={s.id} href={`/system?system=${s.id}`}
                className="text-xs text-brand-text-muted hover:text-white transition-colors hidden sm:block">
                {s.icon} {s.badge}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: `${sys.color}20`, border: `1px solid ${sys.color}40` }}>
            {sys.icon}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{sys.label}</h1>
          <p className="text-brand-text-muted">{sys.description}</p>
        </div>

        {/* Generation form — hide while watching active/complete generation */}
        {!isActive && !isDone && !isFailed && (
          <div className="card p-8 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">What do you want to build?</h2>
              <button
                onClick={() => setShowWizard(!showWizard)}
                className="text-xs text-brand-purple-light hover:text-white transition-colors"
              >
                {showWizard ? '✕ Close Wizard' : '✨ Use Wizard'}
              </button>
            </div>

            {showWizard ? (
              <div className="space-y-3">
                {(WIZARD_QUESTIONS[systemId] || []).map(q => (
                  <div key={q.q}>
                    <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">{q.q}</label>
                    <input
                      value={wizardAnswers[q.q] || ''}
                      onChange={e => setWizardAnswers(prev => ({ ...prev, [q.q]: e.target.value }))}
                      placeholder={q.placeholder}
                      className="input text-sm"
                    />
                  </div>
                ))}
                <button
                  onClick={handleWizard}
                  disabled={wizardLoading}
                  className="btn btn-primary w-full py-3 mt-2"
                >
                  {wizardLoading ? 'Building prompt…' : '✨ Generate Prompt →'}
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={`e.g. ${sys.examples[0]}`}
                  rows={3}
                  className="input resize-none text-sm mb-4"
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate() }}
                />

                <div className="mb-4">
                  <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">Style (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(style === s.id ? '' : s.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                          style === s.id
                            ? 'text-white border-transparent'
                            : 'text-brand-text-muted border-brand-border hover:text-white hover:border-brand-text-muted'
                        }`}
                        style={style === s.id ? { background: `${s.color}30`, borderColor: s.color, color: s.color } : {}}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">Scale</p>
                  <div className="flex gap-2">
                    {SCALE_OPTIONS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setScale(s.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                          scale === s.id
                            ? 'bg-brand-purple/20 border-brand-purple text-brand-purple-light'
                            : 'border-brand-border text-brand-text-muted hover:text-white hover:border-brand-text-muted'
                        }`}
                      >
                        <div className="font-semibold">{s.label}</div>
                        <div className="text-brand-text-dim">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-brand-text-muted hover:text-white transition-colors mb-3"
                >
                  {showAdvanced ? '▲ Hide advanced' : '▼ Advanced options'}
                </button>
                {showAdvanced && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                      Location reference (optional)
                    </label>
                    <input
                      value={locationRef}
                      onChange={e => setLocationRef(e.target.value)}
                      placeholder="e.g. London, New York, Berlin city centre"
                      className="input text-sm"
                    />
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="btn btn-primary w-full py-3.5 text-sm font-semibold"
                >
                  {loading ? 'Queuing generation…' : `Generate with ${sys.badge} →`}
                </button>

                {sys.examples.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <p className="text-xs text-brand-text-dim mb-2">Try an example:</p>
                    <div className="flex flex-wrap gap-2">
                      {sys.examples.map(ex => (
                        <button
                          key={ex}
                          onClick={() => setPrompt(ex)}
                          className="text-xs text-brand-text-muted hover:text-white bg-brand-surface hover:bg-brand-card border border-brand-border rounded-lg px-2.5 py-1 transition-all"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Active / complete / failed generation card */}
        {generationId && generation && (
          <div className="card p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-semibold text-white mb-1">{generation.prompt}</p>
                <p className="text-xs text-brand-text-dim">{sys.label}</p>
              </div>
              <span className={`badge flex-shrink-0 ${
                isDone ? 'badge-green' : isFailed ? 'badge-red' :
                generation.status === 'queued' ? 'badge-orange' : 'badge-purple'
              }`}>
                {generation.status}
              </span>
            </div>

            {isActive && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-brand-text-muted">Progress</span>
                  <span className="text-xs text-brand-purple-light font-mono">{generation.progress || 0}%</span>
                </div>
                <div className="w-full bg-brand-surface rounded-full h-2 overflow-hidden">
                  <div className="progress-bar h-full transition-all duration-1000" style={{ width: `${generation.progress || 5}%` }} />
                </div>
                <p className="text-xs text-brand-text-dim mt-3 text-center">
                  {generation.status === 'queued' && '⏳ Queued — starting soon...'}
                  {generation.status === 'researching' && '🔍 Researching your prompt...'}
                  {generation.status === 'generating' && '⚡ AI is generating your asset...'}
                </p>
              </div>
            )}

            {isDone && (
              <>
                <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-white">Generation complete!</p>
                    {generation.output_metadata?.qualityScore && (
                      <p className={`text-sm font-semibold ${qualityColor(generation.output_metadata.qualityScore)}`}>
                        Quality: {generation.output_metadata.qualityScore}/100 — {qualityLabel(generation.output_metadata.qualityScore)}
                      </p>
                    )}
                    {generation.output_metadata?.qualityNotes && (
                      <p className="text-xs text-brand-text-muted mt-0.5">{generation.output_metadata.qualityNotes}</p>
                    )}
                  </div>
                </div>

                {generation.output_url && (
                  <a href={generation.output_url} download
                    className="btn btn-primary w-full py-3.5 text-sm font-semibold mb-4 text-center block">
                    ⬇ Download .rbxmx File
                  </a>
                )}

                {generation.spec_items?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-3">What was generated</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {generation.spec_items.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-brand-text-muted">
                          <span className="text-brand-purple-light mt-0.5">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generation.output_metadata?.validationWarnings?.length > 0 && (
                  <div className="mb-6 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs font-semibold text-yellow-300 mb-2">⚠ Validation notes</p>
                    {generation.output_metadata.validationWarnings.map((w: string, i: number) => (
                      <p key={i} className="text-xs text-yellow-200">{w}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setGeneration(null); setGenerationId(null)
                      router.replace(`/system?system=${systemId}`)
                    }}
                    className="btn btn-secondary flex-1 py-2.5 text-sm"
                  >
                    + New Generation
                  </button>
                  <button
                    onClick={() => setCriticismMode(!criticismMode)}
                    className="btn btn-secondary flex-1 py-2.5 text-sm"
                  >
                    ✏ Improve This
                  </button>
                </div>

                {criticismMode && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                      What was wrong / what to improve?
                    </label>
                    <textarea
                      value={criticism}
                      onChange={e => setCriticism(e.target.value)}
                      placeholder="e.g. Needs more rooms, wrong livery colour, missing reception desk..."
                      rows={2}
                      className="input resize-none text-sm mb-3"
                    />
                    <button
                      onClick={handleCriticise}
                      disabled={criticiseLoading || !criticism.trim()}
                      className="btn btn-primary w-full py-2.5 text-sm"
                    >
                      {criticiseLoading ? 'Improving prompt…' : '✏ Improve & Regenerate →'}
                    </button>
                  </div>
                )}
              </>
            )}

            {isFailed && (
              <div className="text-center">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-5">
                  <p className="text-red-300 text-sm">Generation failed</p>
                  {generation.output_metadata?.error && (
                    <p className="text-xs text-red-400 mt-1">{generation.output_metadata.error}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setPrompt(generation.prompt || '')
                    setGeneration(null); setGenerationId(null)
                    router.replace(`/system?system=${systemId}`)
                  }}
                  className="btn btn-secondary px-6 py-2.5 text-sm"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {loading && !generation && (
          <div className="card p-8 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-brand-purple border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-brand-text-muted text-sm">Queuing generation…</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SystemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
      </div>
    }>
      <SystemPageInner />
    </Suspense>
  )
}

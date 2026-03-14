'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SYSTEMS, STYLES, SIZES, qualityColor, qualityLabel } from '@/lib/utils'

const TEMPLATES = {
  builder: [
    { label: '🏛️ Police Station', prompt: 'A fully furnished UK police station with reception desk, holding cells, briefing room, locker room, CID office, evidence storage, and vehicle garage bay' },
    { label: '🚒 Fire Station', prompt: 'A UK fire station with two engine bays, crew quarters, briefing room, watch room, brass pole, kitchen, and outdoor drill yard' },
    { label: '🏥 Hospital A&E', prompt: 'A hospital A&E with triage, waiting area, resus bays, treatment rooms, nurses station, and ambulance bay' },
    { label: '🏦 Bank', prompt: 'A high street bank with bulletproof glass counter, vault room, manager office, staff room, and ATM lobby' },
    { label: '🏪 Corner Shop', prompt: 'A convenience store with shelving aisles, refrigerated section, checkout counter, stockroom, and staff toilet' },
    { label: '🏫 School', prompt: 'A secondary school with classrooms, science lab, headteacher office, reception, canteen, gym hall, and playground' },
    { label: '🏨 Hotel Lobby', prompt: 'A luxury hotel lobby with front desk, seating area, lifts, concierge desk, bar area, and grand staircase' },
    { label: '🚔 Custody Suite', prompt: 'A police custody suite with booking desk, fingerprinting area, 8 holding cells with toilets, interview rooms, and solicitor room' },
  ],
  modeling: [
    { label: '🚗 Police BMW 5 Series', prompt: 'A German Polizei BMW 5 Series with silver/green livery, federal eagle badge, full ELS light bar, siren, interior with prisoner screen, working doors' },
    { label: '🚑 NHS Ambulance', prompt: 'A UK NHS ambulance with yellow/green Battenburg livery, ELS lights, rear patient compartment with stretcher, paramedic cab' },
    { label: '🚒 Fire Engine', prompt: 'A UK fire engine with red livery, ELS, aerial ladder, hose reels, side compartments, crew cab seating 4' },
    { label: '🔫 M4A1 Rifle', prompt: 'An M4A1 assault rifle with EoTech sight, 30-round magazine, RIS handguard, fireable with damage, recoil, and muzzle flash' },
    { label: '🚁 Police Helicopter', prompt: 'A police helicopter with blue/yellow livery, searchlight, ELS strobes, working rotors, copilot seat with camera lock-on and spotlight toggle' },
    { label: '⛓️ Handcuffs', prompt: 'Handcuffs tool that detains players freezing movement, allows searching inventory, and releases with server-side validation and visual cuff model' },
    { label: '🚤 Police RIB', prompt: 'A police rigid inflatable boat with chequered livery, ELS, twin outboard engines, 4 seats, working throttle and steering' },
    { label: '⚡ Taser', prompt: 'A police taser that fires probes at a target, stuns them with ragdoll animation, with reload mechanic and safety toggle' },
  ],
  project: [
    { label: '🌆 UK City RP Map', prompt: 'A full UK city roleplay map with police station, fire station, hospital, town hall, shops, residential streets, park, and motorway junction' },
    { label: '🇩🇪 German Police Pack', prompt: 'A complete German Bundespolizei pack including BMW 5 Series, Audi A6 unmarked, police helicopter, officer uniform, handcuffs, and pistol' },
    { label: '🏖️ Coastal Town', prompt: 'A coastal roleplay town with harbour, beach, seafront shops, hotel, lifeboat station, fish and chip shop, arcades, and car park' },
    { label: '🏙️ City Block', prompt: 'A dense city block with 6 varied buildings: apartments, office, cafe, newsagent, underground car park, with streets and alleyways' },
    { label: '🚨 Emergency Services Pack', prompt: 'A full emergency services pack with matching police station, fire station, ambulance station, plus one vehicle each in matching theme' },
    { label: '🏫 School Campus', prompt: 'A full school campus with main building, sports hall, playing fields, car park, and staff rooms ready for school roleplay' },
  ],
}

const WIZARD = {
  builder: [
    { id: 'buildingType', label: 'Building Type', options: ['Police Station','Fire Station','Hospital','School','Bank','Shop / Store','Hotel','Office Building','Residential House','Government Building','Prison / Custody Suite','Military Base'], allowOther: true, multi: false },
    { id: 'country', label: 'Country / Style', options: ['UK','USA','Germany','Australia','France','Generic / Modern'], allowOther: true, multi: false },
    { id: 'size', label: 'Scale', options: ['Small','Medium','Large','Massive'], allowOther: false, multi: false },
    { id: 'rooms', label: 'Must-Have Rooms', options: ['Reception','Cells / Custody','Briefing Room','Locker Room','Garage Bay','Evidence Storage','Kitchen','Toilets','Office Area'], allowOther: true, multi: true },
    { id: 'extras', label: 'Extras', options: ['Fully furnished interior','Working doors','Exterior & surroundings','Night lighting','Security cameras','Signage'], allowOther: true, multi: true },
  ],
  modeling: [
    { id: 'assetType', label: 'Asset Type', options: ['Police Car','Fire Engine','Ambulance','Helicopter','Motorbike','Van / Truck','Boat','Firearm','Melee Weapon','Tool / Equipment','Uniform'], allowOther: true, multi: false },
    { id: 'country', label: 'Country / Service', options: ['UK','USA','Germany','Australia','France','Generic'], allowOther: true, multi: false },
    { id: 'features', label: 'Features', options: ['ELS Lights','Siren','Working Doors','Interior','Prisoner Screen','Functional Script','Damage System','Animations'], allowOther: true, multi: true },
    { id: 'extras', label: 'Extras', options: ['Realistic livery','Number plates','Window tint','Multiple livery variants'], allowOther: true, multi: true },
  ],
  project: [
    { id: 'projectType', label: 'Project Type', options: ['Full City / Town Map','Themed Pack','Single District','Campus / Complex','Island Map','Industrial Area'], allowOther: true, multi: false },
    { id: 'theme', label: 'Theme', options: ['UK Emergency Services','German Police','US Law Enforcement','Australian Services','Military','Civilian Roleplay'], allowOther: true, multi: false },
    { id: 'includes', label: 'What to Include', options: ['Police Station','Fire Station','Hospital','Vehicles','Weapons & Tools','Uniforms','Roads & Streets','Shops','Residential Area'], allowOther: true, multi: true },
    { id: 'scale', label: 'Scale', options: ['Small','Medium','Large','Massive'], allowOther: false, multi: false },
  ],
}

function WizardStep({ step, value, onChange }: { step: any; value: string | string[]; onChange: (v: string | string[]) => void }) {
  const [otherText, setOtherText] = useState('')
  const [showOther, setShowOther] = useState(false)

  function toggle(opt: string) {
    if (step.multi) {
      const arr = value as string[]
      onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt])
    } else onChange(opt === value ? '' : opt)
  }

  function commitOther() {
    if (!otherText.trim()) return
    if (step.multi) { const arr = value as string[]; if (!arr.includes(otherText.trim())) onChange([...arr, otherText.trim()]) }
    else onChange(otherText.trim())
    setOtherText(''); setShowOther(false)
  }

  const sel = (opt: string) => step.multi ? (value as string[]).includes(opt) : value === opt

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">{step.label}</p>
      <div className="flex flex-wrap gap-2">
        {step.options.map((opt: string) => (
          <button key={opt} onClick={() => toggle(opt)} type="button"
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${sel(opt) ? 'bg-brand-purple border-brand-purple text-white' : 'bg-brand-surface border-brand-border text-brand-text-muted hover:border-brand-purple hover:text-white'}`}>
            {opt}
          </button>
        ))}
        {step.allowOther && !showOther && (
          <button onClick={() => setShowOther(true)} type="button"
            className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-brand-muted text-brand-text-dim hover:border-brand-cyan hover:text-brand-cyan transition-all">
            + Other
          </button>
        )}
        {step.allowOther && showOther && (
          <div className="flex gap-2 items-center">
            <input autoFocus value={otherText} onChange={e => setOtherText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitOther()} placeholder="Type anything…"
              className="px-3 py-1.5 rounded-lg text-sm bg-brand-surface border border-brand-cyan text-white outline-none w-36" />
            <button onClick={commitOther} type="button" className="px-2 py-1.5 rounded-lg text-xs bg-brand-cyan text-brand-bg font-bold">Add</button>
            <button onClick={() => setShowOther(false)} type="button" className="text-brand-text-dim hover:text-white text-sm">✕</button>
          </div>
        )}
      </div>
      {step.multi && (value as string[]).filter((v: string) => !step.options.includes(v)).map((c: string) => (
        <span key={c} className="inline-flex items-center gap-1 mt-2 mr-1 px-2 py-0.5 rounded-full text-xs bg-brand-cyan/20 border border-brand-cyan text-brand-cyan">
          {c}<button onClick={() => onChange((value as string[]).filter(x => x !== c))} type="button" className="opacity-60 hover:opacity-100">✕</button>
        </span>
      ))}
    </div>
  )
}

function SystemInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const systemType = (sp.get('system') || 'builder') as 'builder' | 'modeling' | 'project'
  const watchId = sp.get('watch')

  const [tab, setTab] = useState<'prompt' | 'templates' | 'wizard'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [size, setSize] = useState('Medium')
  const [variations, setVariations] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [watchGen, setWatchGen] = useState<any>(null)

  const wizardSteps = WIZARD[systemType] || WIZARD.builder
  const [wizardVals, setWizardVals] = useState<Record<string, string | string[]>>(() => {
    const i: Record<string, string | string[]> = {}
    wizardSteps.forEach(s => { i[s.id] = s.multi ? [] : '' })
    return i
  })

  const supabase = createClient()

  useEffect(() => {
    if (!watchId) return
    const iv = setInterval(async () => {
      const { data } = await supabase.from('generations').select('*').eq('id', watchId).single()
      if (data) { setWatchGen(data); if (data.status === 'complete' || data.status === 'failed') clearInterval(iv) }
    }, 2000)
    return () => clearInterval(iv)
  }, [watchId])

  function buildWizardPrompt() {
    return wizardSteps.map(s => {
      const v = wizardVals[s.id]
      if (!v || (Array.isArray(v) && !v.length)) return ''
      return `${s.label}: ${Array.isArray(v) ? v.join(', ') : v}`
    }).filter(Boolean).join('. ')
  }

  async function handleGenerate(overridePrompt?: string) {
    const finalPrompt = overridePrompt || (tab === 'wizard' ? buildWizardPrompt() : prompt)
    if (!finalPrompt.trim()) { setError('Please enter a prompt.'); return }
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: gen, error: ge } = await supabase.from('generations')
        .insert({ user_id: user.id, system_type: systemType, prompt: finalPrompt })
        .select().single()
      if (ge || !gen) throw new Error(ge?.message || 'Failed to start')
      fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: gen.id, prompt: finalPrompt, systemType, userId: user.id, style, size }),
      })
      router.push(`/system?system=${systemType}&watch=${gen.id}`)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const sys = SYSTEMS[systemType]
  const templates = TEMPLATES[systemType] || []

  // Watch mode
  if (watchId) {
    const status = watchGen?.status || 'queued'
    const progress = watchGen?.progress || 0
    const qs = watchGen?.output_metadata?.qualityScore
    const steps = [
      { key: 'researching', label: 'Researching references' },
      { key: 'enhancing', label: 'Enhancing prompt' },
      { key: 'generating', label: 'Running specialist agents' },
      { key: 'checking', label: 'Quality check' },
      { key: 'complete', label: 'Complete' },
    ]
    const stepIdx = steps.findIndex(s => s.key === status)

    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">{sys.icon}</div>
              <h2 className="font-bold text-xl text-white">{sys.label}</h2>
              <p className="text-brand-text-muted text-sm mt-1 truncate max-w-sm mx-auto">{watchGen?.prompt || 'Preparing…'}</p>
            </div>

            {/* Step tracker */}
            <div className="space-y-2 mb-6">
              {steps.map((s, i) => {
                const done = stepIdx > i || status === 'complete'
                const active = stepIdx === i && status !== 'complete' && status !== 'failed'
                return (
                  <div key={s.key} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${active ? 'bg-brand-purple/15 border border-brand-purple/30' : done ? 'opacity-50' : 'opacity-30'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${done ? 'bg-brand-green text-brand-bg' : active ? 'border-2 border-brand-purple' : 'border border-brand-border'}`}>
                      {done ? '✓' : active ? <span className="w-2 h-2 bg-brand-purple rounded-full animate-pulse-slow" /> : ''}
                    </div>
                    <span className={`text-sm ${active ? 'text-white font-medium' : 'text-brand-text-muted'}`}>{s.label}</span>
                    {active && <div className="ml-auto w-4 h-4 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />}
                  </div>
                )
              })}
              {status === 'failed' && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">✕</div>
                  <span className="text-sm text-red-400">Generation failed</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-brand-surface rounded-full h-2 mb-4 overflow-hidden">
              <div className="progress-bar h-full transition-all duration-700" style={{ width: `${status === 'complete' ? 100 : progress}%` }} />
            </div>

            {status === 'complete' && (
              <div className="space-y-3">
                {qs && (
                  <div className="p-4 bg-brand-green/10 border border-brand-green/30 rounded-xl text-center">
                    <p className="text-brand-green font-semibold">Generation Complete</p>
                    <p className={`text-2xl font-bold mt-1 ${qualityColor(qs)}`}>{qs}/100 — {qualityLabel(qs)}</p>
                    {watchGen?.output_metadata?.qualityNotes && (
                      <p className="text-brand-text-muted text-xs mt-1">{watchGen.output_metadata.qualityNotes}</p>
                    )}
                  </div>
                )}
                {watchGen?.spec_items?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {watchGen.spec_items.map((s: any) => (
                      <div key={s.label} className="card p-3 text-center">
                        <p className="text-lg font-bold text-white">{s.count}</p>
                        <p className="text-xs text-brand-text-dim">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <a href={watchGen.output_url} download className="btn btn-primary w-full py-3 text-sm block text-center">
                  ⬇ Download .rbxmx file
                </a>
                <button onClick={() => router.push('/dashboard')}
                  className="btn btn-secondary w-full py-2.5 text-sm">Back to Dashboard</button>
              </div>
            )}

            {status === 'failed' && (
              <div className="space-y-3">
                <p className="text-red-400 text-sm text-center">{watchGen?.output_metadata?.error || 'Generation failed. Please try again.'}</p>
                <button onClick={() => router.push(`/system?system=${systemType}`)} className="btn btn-primary w-full py-3 text-sm">Try Again</button>
                <button onClick={() => router.push('/dashboard')} className="btn btn-secondary w-full py-2.5 text-sm">Dashboard</button>
              </div>
            )}

            {status !== 'complete' && status !== 'failed' && (
              <p className="text-brand-text-dim text-xs text-center mt-2">Usually takes 30–90 seconds. Keep this tab open.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-brand-text-dim hover:text-white text-sm mb-4 inline-flex items-center gap-1">← Dashboard</button>
          <h1 className="text-3xl font-bold text-white"><span className="mr-2">{sys.icon}</span><span style={{ color: sys.colorLight }}>{sys.label}</span></h1>
          <p className="text-brand-text-muted mt-1 text-sm">Describe what you want to generate</p>
        </div>

        {/* Style & Size row */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-40">
            <p className="text-xs text-brand-text-dim mb-1.5">Style</p>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="input text-sm py-2">
              <option value="">Default</option>
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <p className="text-xs text-brand-text-dim mb-1.5">Size</p>
            <select value={size} onChange={e => setSize(e.target.value)}
              className="input text-sm py-2">
              {SIZES.map(s => <option key={s.label} value={s.label}>{s.label} — {s.desc}</option>)}
            </select>
          </div>
          <div className="w-28">
            <p className="text-xs text-brand-text-dim mb-1.5">Variations</p>
            <select value={variations} onChange={e => setVariations(Number(e.target.value))}
              className="input text-sm py-2">
              <option value={1}>1 (default)</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-brand-card border border-brand-border rounded-xl mb-6 w-fit">
          {(['prompt', 'templates', 'wizard'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} type="button"
              className={`tab-btn ${tab === t ? 'active' : ''}`}>
              {t === 'prompt' ? '✏️ Prompt' : t === 'templates' ? '⚡ Templates' : '🧙 Wizard'}
            </button>
          ))}
        </div>

        {/* Prompt tab */}
        {tab === 'prompt' && (
          <div className="card p-6">
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder={`Describe your ${sys.tagline.toLowerCase()} in detail…`}
              rows={5} className="input resize-none" />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <button onClick={() => handleGenerate()} disabled={loading || !prompt.trim()} type="button"
              className="btn btn-primary w-full mt-4 py-3 text-sm">
              {loading ? 'Starting…' : `⚡ Generate${variations > 1 ? ` (${variations} variations)` : ''}`}
            </button>
          </div>
        )}

        {/* Templates tab */}
        {tab === 'templates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.label} className="card card-hover p-5">
                <p className="font-bold text-white mb-1">{t.label}</p>
                <p className="text-brand-text-dim text-xs leading-relaxed mb-4 line-clamp-2">{t.prompt}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setPrompt(t.prompt); setTab('prompt') }} type="button"
                    className="btn btn-secondary flex-1 py-2 text-xs">Edit first</button>
                  <button onClick={() => handleGenerate(t.prompt)} disabled={loading} type="button"
                    className="btn btn-primary flex-1 py-2 text-xs">
                    {loading ? '…' : '⚡ Generate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wizard tab */}
        {tab === 'wizard' && (
          <div className="card p-6">
            {wizardSteps.map((step: any) => (
              <WizardStep key={step.id} step={step} value={wizardVals[step.id]}
                onChange={v => setWizardVals(prev => ({ ...prev, [step.id]: v }))} />
            ))}
            {buildWizardPrompt() && (
              <div className="mt-2 p-4 bg-brand-surface rounded-xl border border-brand-border mb-4">
                <p className="text-xs text-brand-text-dim uppercase tracking-wider mb-1">Prompt Preview</p>
                <p className="text-sm text-white">{buildWizardPrompt()}</p>
              </div>
            )}
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button onClick={() => handleGenerate()} disabled={loading || !buildWizardPrompt()} type="button"
              className="btn btn-primary w-full py-3 text-sm">
              {loading ? 'Starting…' : '⚡ Generate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SystemPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading…</div>}>
      <SystemInner />
    </Suspense>
  )
}

'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

const TEMPLATES = {
  builder: [
    { label: '🏛️ Police Station', prompt: 'A fully furnished UK police station with reception desk, holding cells, briefing room, locker room, CID office, evidence storage, and a vehicle garage bay' },
    { label: '🚒 Fire Station', prompt: 'A UK fire station with two engine bays, crew quarters with beds and lockers, briefing room, watch room, pole, kitchen, and outdoor drill yard' },
    { label: '🏥 Hospital A&E', prompt: 'A hospital accident and emergency department with triage, waiting area, resus bays, treatment rooms, nurses station, and ambulance bay' },
    { label: '🏦 Bank', prompt: 'A high street bank with public counter area with bulletproof glass, vault room, manager office, staff room, and ATM lobby' },
    { label: '🏪 Corner Shop', prompt: 'A convenience store with shelving aisles, refrigerated section, checkout counter, stockroom, and staff toilet' },
    { label: '🏫 School', prompt: 'A secondary school with classrooms, science lab, headteacher office, reception, canteen, gym hall, and outdoor playground' },
    { label: '🏨 Hotel Lobby', prompt: 'A luxury hotel lobby with front desk, seating area, lifts, concierge desk, bar area, and grand staircase' },
    { label: '🚔 Custody Suite', prompt: 'A police custody suite with booking desk, fingerprinting area, 8 holding cells with toilets, interview rooms, charging desk, and solicitor room' },
  ],
  modeling: [
    { label: '🚗 Police BMW 5 Series', prompt: 'A German Polizei BMW 5 Series patrol car with silver/green livery, federal eagle badge, full ELS light bar, siren, interior with prisoner screen, working doors' },
    { label: '🚑 Ambulance', prompt: 'A UK NHS ambulance with yellow/green Battenburg livery, ELS lights, rear patient compartment with stretcher and equipment, paramedic cab' },
    { label: '🚒 Fire Engine', prompt: 'A UK fire engine with red livery, ELS, aerial ladder, hose reels, side compartments with equipment, crew cab seating 4' },
    { label: '🔫 M4A1 Rifle', prompt: 'An M4A1 assault rifle with EoTech holographic sight, 30-round magazine, RIS handguard, collapsible stock, muzzle flash, fireable with damage and recoil' },
    { label: '🚁 Police Helicopter', prompt: 'A police helicopter with blue/yellow livery, searchlight, belly camera, ELS strobes, working rotors, copilot seat with camera lock-on UI' },
    { label: '⛓️ Handcuffs', prompt: 'Handcuffs tool that detain players (freeze movement), allow searching their inventory, and release them, with server-side validation and visual cuff model' },
    { label: '🚤 Police RIB', prompt: 'A police rigid inflatable boat with chequered livery, ELS, twin outboard engines, 4 seats, working throttle and steering' },
    { label: '🔌 Taser', prompt: 'A police taser that fires probes at a target, temporarily stuns them with ragdoll animation, with reload and safety toggle' },
  ],
  project: [
    { label: '🌆 UK City RP Map', prompt: 'A full UK city roleplay map with police station, fire station, hospital, town hall, shops, residential streets, park, car park, and motorway junction' },
    { label: '🇩🇪 German Police Pack', prompt: 'A complete German Bundespolizei themed pack including BMW 5 Series patrol car, Audi A6 unmarked, police helicopter, officer uniform, handcuffs, and pistol' },
    { label: '🏖️ Coastal Town', prompt: 'A coastal roleplay town with harbour, beach, seafront shops, hotel, lifeboat station, fish and chip shop, arcades, and car park' },
    { label: '🏙️ City Block', prompt: 'A dense city block with 6 varied buildings including apartments, office, cafe, newsagent, and underground car park, with streets and alleyways' },
    { label: '🚨 Emergency Services Pack', prompt: 'A full emergency services pack with police station, fire station, ambulance station, and one vehicle each (police car, fire engine, ambulance) all matching theme' },
    { label: '🏫 School Campus', prompt: 'A full school campus map with main building, sports hall, playing fields, car park, and staff rooms ready for school roleplay' },
  ],
}

const WIZARD_STEPS = {
  builder: [
    { id: 'buildingType', label: 'Building Type', options: ['Police Station','Fire Station','Hospital','School','Bank','Shop / Store','Hotel','Office Building','Residential House','Government Building','Prison / Custody Suite','Military Base'], allowOther: true, multi: false },
    { id: 'country', label: 'Country / Style', options: ['UK','USA','Germany','Australia','France','Generic / Modern'], allowOther: true, multi: false },
    { id: 'size', label: 'Size', options: ['Small','Medium','Large','Massive'], allowOther: false, multi: false },
    { id: 'rooms', label: 'Must-Have Rooms', options: ['Reception','Cells / Custody','Briefing Room','Locker Room','Garage Bay','Evidence Storage','Kitchen','Toilets','Office Area'], allowOther: true, multi: true },
    { id: 'extras', label: 'Extras', options: ['Fully furnished interior','Working doors','Exterior surroundings','Night lighting','Security cameras','Signage'], allowOther: true, multi: true },
  ],
  modeling: [
    { id: 'assetType', label: 'Asset Type', options: ['Police Car','Fire Engine','Ambulance','Helicopter','Motorbike','Van / Truck','Boat','Firearm','Melee Weapon','Tool / Equipment','Uniform / Clothing'], allowOther: true, multi: false },
    { id: 'country', label: 'Country / Service', options: ['UK','USA','Germany','Australia','France','Generic'], allowOther: true, multi: false },
    { id: 'features', label: 'Features', options: ['ELS Lights','Siren','Working Doors','Interior','Prisoner Screen','Script / Functional','Damage System','Animations'], allowOther: true, multi: true },
    { id: 'extras', label: 'Extras', options: ['Realistic livery','Number plates','Window tint','Custom sound IDs','Multiple livery variants'], allowOther: true, multi: true },
  ],
  project: [
    { id: 'projectType', label: 'Project Type', options: ['Full City / Town Map','Themed Pack (vehicles + uniforms + gear)','Single District','Campus / Complex','Island Map','Industrial Area'], allowOther: true, multi: false },
    { id: 'theme', label: 'Theme / Setting', options: ['UK Emergency Services','German Police','US Law Enforcement','Australian Services','Military','Civilian Roleplay','Fantasy / Sci-Fi'], allowOther: true, multi: false },
    { id: 'includes', label: 'What to Include', options: ['Police Station','Fire Station','Hospital','Vehicles','Weapons & Tools','Uniforms','Roads & Streets','Shops & Businesses','Residential Area'], allowOther: true, multi: true },
    { id: 'scale', label: 'Scale', options: ['Small (starter map)','Medium (full town)','Large (city)','Massive (open world)'], allowOther: false, multi: false },
  ],
}

function WizardStep({ step, value, onChange }: {
  step: { id: string; label: string; options: string[]; allowOther: boolean; multi: boolean }
  value: string | string[]
  onChange: (val: string | string[]) => void
}) {
  const [otherText, setOtherText] = useState('')
  const [showOther, setShowOther] = useState(false)
  const isMulti = step.multi

  function toggle(opt: string) {
    if (isMulti) {
      const arr = value as string[]
      onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt])
    } else {
      onChange(opt === value ? '' : opt)
    }
  }

  function commitOther() {
    if (!otherText.trim()) return
    if (isMulti) {
      const arr = value as string[]
      if (!arr.includes(otherText.trim())) onChange([...arr, otherText.trim()])
    } else {
      onChange(otherText.trim())
    }
    setOtherText('')
    setShowOther(false)
  }

  const isSelected = (opt: string) => isMulti ? (value as string[]).includes(opt) : value === opt

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-brand-text-muted uppercase tracking-wider mb-3">{step.label}</p>
      <div className="flex flex-wrap gap-2">
        {step.options.map(opt => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${isSelected(opt) ? 'bg-brand-purple border-brand-purple text-white' : 'bg-brand-card border-brand-border text-brand-text-muted hover:border-brand-purple hover:text-white'}`}>
            {opt}
          </button>
        ))}
        {step.allowOther && !showOther && (
          <button onClick={() => setShowOther(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-brand-muted text-brand-text-dim hover:border-brand-cyan hover:text-brand-cyan transition-all">
            + Other
          </button>
        )}
        {step.allowOther && showOther && (
          <div className="flex gap-2 items-center">
            <input autoFocus value={otherText} onChange={e => setOtherText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitOther()}
              placeholder="Type anything…"
              className="px-3 py-1.5 rounded-lg text-sm bg-brand-card border border-brand-cyan text-white placeholder-brand-text-dim outline-none w-44" />
            <button onClick={commitOther} className="px-3 py-1.5 rounded-lg text-sm bg-brand-cyan text-brand-bg font-bold">Add</button>
            <button onClick={() => setShowOther(false)} className="px-2 py-1.5 text-brand-text-dim hover:text-white text-sm">✕</button>
          </div>
        )}
      </div>
      {isMulti && (value as string[]).filter(v => !step.options.includes(v)).map(custom => (
        <span key={custom} className="inline-flex items-center gap-1 mt-2 mr-2 px-3 py-1 rounded-full text-xs bg-brand-cyan/20 border border-brand-cyan text-brand-cyan">
          {custom}
          <button onClick={() => onChange((value as string[]).filter(x => x !== custom))} className="opacity-60 hover:opacity-100">✕</button>
        </span>
      ))}
    </div>
  )
}

function SystemPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const systemType = (searchParams.get('system') || 'builder') as 'builder' | 'modeling' | 'project'
  const [tab, setTab] = useState<'prompt' | 'templates' | 'wizard'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const wizardSteps = WIZARD_STEPS[systemType] || WIZARD_STEPS.builder
  const [wizardValues, setWizardValues] = useState<Record<string, string | string[]>>(() => {
    const init: Record<string, string | string[]> = {}
    wizardSteps.forEach(s => { init[s.id] = s.multi ? [] : '' })
    return init
  })

  const supabase = createClient()

  function buildWizardPrompt() {
    return wizardSteps
      .map(step => {
        const val = wizardValues[step.id]
        if (!val || (Array.isArray(val) && val.length === 0)) return ''
        return `${step.label}: ${Array.isArray(val) ? val.join(', ') : val}`
      })
      .filter(Boolean)
      .join('. ')
  }

  async function handleGenerate(overridePrompt?: string) {
    const finalPrompt = overridePrompt || (tab === 'wizard' ? buildWizardPrompt() : prompt)
    if (!finalPrompt.trim()) { setError('Please enter a prompt or fill in the wizard.'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: gen, error: genErr } = await supabase
        .from('generations').insert({ user_id: user.id, system_type: systemType, prompt: finalPrompt }).select().single()
      if (genErr || !gen) throw new Error(genErr?.message || 'Failed to create generation')
      await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: gen.id, prompt: finalPrompt, systemType }),
      })
      router.push(`/dashboard/generate/${gen.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const systemLabels = {
    builder: { icon: '🏗️', label: 'Builder System', color: 'text-brand-purple' },
    modeling: { icon: '🚗', label: 'Modeling & Asset System', color: 'text-brand-cyan' },
    project: { icon: '🗺️', label: 'Project System', color: 'text-brand-green' },
  }
  const sys = systemLabels[systemType]
  const templates = TEMPLATES[systemType] || []

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <button onClick={() => router.push('/dashboard')} className="text-brand-text-dim hover:text-white text-sm mb-4 inline-flex items-center gap-1">← Back</button>
          <h1 className="text-3xl font-bold"><span className="mr-2">{sys.icon}</span><span className={sys.color}>{sys.label}</span></h1>
          <p className="text-brand-text-muted mt-1">Describe what you want to generate</p>
        </div>

        <div className="flex gap-1 p-1 bg-brand-card border border-brand-border rounded-xl mb-8 w-fit">
          {(['prompt', 'templates', 'wizard'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-brand-purple text-white shadow' : 'text-brand-text-muted hover:text-white'}`}>
              {t === 'prompt' ? '✏️ Prompt' : t === 'templates' ? '⚡ Templates' : '🧙 Wizard'}
            </button>
          ))}
        </div>

        {tab === 'prompt' && (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
            <label className="block text-sm font-semibold text-brand-text-muted mb-3">Describe your build</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. A fully furnished UK police station with reception, 8 holding cells, briefing room, and vehicle garage..."
              rows={5}
              className="w-full bg-brand-surface border border-brand-border rounded-xl p-4 text-white placeholder-brand-text-dim resize-none outline-none focus:border-brand-purple transition-colors text-sm" />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <button onClick={() => handleGenerate()} disabled={loading || !prompt.trim()}
              className="mt-4 w-full py-3 rounded-xl bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all">
              {loading ? 'Starting…' : '⚡ Generate'}
            </button>
          </div>
        )}

        {tab === 'templates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.label} className="bg-brand-card border border-brand-border rounded-2xl p-5 hover:border-brand-purple transition-all">
                <p className="font-bold text-white mb-2">{t.label}</p>
                <p className="text-brand-text-dim text-xs leading-relaxed mb-4 line-clamp-3">{t.prompt}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setPrompt(t.prompt); setTab('prompt') }}
                    className="flex-1 py-2 rounded-lg border border-brand-border text-brand-text-muted hover:text-white hover:border-brand-purple text-xs font-medium transition-all">
                    Edit first
                  </button>
                  <button onClick={() => handleGenerate(t.prompt)} disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-brand-purple text-white text-xs font-bold hover:bg-brand-purple/80 transition-all disabled:opacity-40">
                    {loading ? '…' : '⚡ Generate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'wizard' && (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
            {wizardSteps.map(step => (
              <WizardStep key={step.id} step={step} value={wizardValues[step.id]}
                onChange={val => setWizardValues(prev => ({ ...prev, [step.id]: val }))} />
            ))}
            {buildWizardPrompt() && (
              <div className="mt-4 p-4 bg-brand-surface rounded-xl border border-brand-border">
                <p className="text-xs text-brand-text-dim uppercase tracking-wider mb-1">Generated Prompt</p>
                <p className="text-sm text-white">{buildWizardPrompt()}</p>
              </div>
            )}
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <button onClick={() => handleGenerate()} disabled={loading || !buildWizardPrompt()}
              className="mt-4 w-full py-3 rounded-xl bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all">
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
      <SystemPageInner />
    </Suspense>
  )
}

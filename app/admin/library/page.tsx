'use client'
// app/admin/knowledge/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BUILDING_KB, VEHICLE_KB, SCRIPTING_KB, MAP_KB } from '@/lib/knowledge/index'

const DEFAULT_SECTIONS = {
  building: BUILDING_KB,
  vehicle: VEHICLE_KB,
  scripting: SCRIPTING_KB,
  map: MAP_KB,
}

export default function KnowledgePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'building' | 'vehicle' | 'scripting' | 'map'>('building')
  const [values, setValues] = useState(DEFAULT_SECTIONS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }

      // Load any saved overrides from DB
      const { data } = await supabase.from('knowledge_overrides').select('*')
      if (data?.length) {
        const overrides: any = {}
        data.forEach((d: any) => { overrides[d.section] = d.content })
        setValues(prev => ({ ...prev, ...overrides }))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    await supabase
      .from('knowledge_overrides')
      .upsert({ section: tab, content: values[tab], updated_at: new Date().toISOString() }, { onConflict: 'section' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function reset() {
    setValues(prev => ({ ...prev, [tab]: DEFAULT_SECTIONS[tab] }))
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading…</div>
  )

  const tabs = [
    { key: 'building', label: '🏗️ Buildings' },
    { key: 'vehicle', label: '🚗 Vehicles' },
    { key: 'scripting', label: '💻 Scripting' },
    { key: 'map', label: '🗺️ Maps' },
  ] as const

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <nav className="border-b border-brand-border bg-brand-bg/90 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-brand-text-dim hover:text-white text-sm">← Admin</a>
            <span className="text-brand-border">|</span>
            <span className="font-bold">Knowledge Base Editor</span>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="btn btn-secondary text-xs px-3 py-1.5">Reset to Default</button>
            <button onClick={save} disabled={saving} className="btn btn-primary text-xs px-4 py-1.5">
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-4 p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30">
          <p className="text-xs text-brand-cyan font-mono">
            ℹ️ Edits saved here are stored in the <code>knowledge_overrides</code> database table and injected into every future generation. Changes take effect immediately on the next generation.
          </p>
        </div>
        <div className="mb-6">
          <p className="text-brand-text-muted text-sm">Edit the veteran knowledge that gets injected into every generation. Changes here immediately affect all future builds.</p>
        </div>
        <div className="flex gap-1 p-1 bg-brand-card border border-brand-border rounded-xl mb-6 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`tab-btn ${tab === t.key ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>
        <textarea
          value={values[tab]}
          onChange={e => setValues(prev => ({ ...prev, [tab]: e.target.value }))}
          rows={30}
          className="input font-mono text-xs resize-none"
          spellCheck={false}
        />
        <p className="text-xs text-brand-text-dim mt-2">
          This knowledge is injected verbatim into the AI prompt. Be specific, use imperative instructions, and include exact measurements and patterns.
        </p>
      </div>
    </div>
  )
}

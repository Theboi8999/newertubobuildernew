'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SYSTEMS, qualityColor, qualityLabel } from '@/lib/utils'

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [generations, setGenerations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: gens } = await supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      setGenerations(gens || [])
      setLoading(false)
    }
    load()
  }, [])

  async function regen(gen: any) {
    const { data: newGen } = await supabase.from('generations')
      .insert({ user_id: user.id, system_type: gen.system_type, prompt: gen.prompt })
      .select().single()
    if (!newGen) return
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId: newGen.id, prompt: gen.prompt, systemType: gen.system_type, userId: user.id }),
    })
    router.push(`/system?system=${gen.system_type}&watch=${newGen.id}`)
  }

  async function rateGen(id: string, rating: number) {
    await supabase.from('generations').update({ rating }).eq('id', id)
    setGenerations(prev => prev.map(g => g.id === id ? { ...g, rating } : g))
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
    </div>
  )

  const statusBadge: Record<string, string> = {
    queued: 'badge badge-orange', researching: 'badge badge-cyan',
    enhancing: 'badge badge-cyan', generating: 'badge badge-purple',
    checking: 'badge badge-purple', complete: 'badge badge-green', failed: 'badge badge-red',
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-white">TURBO<span className="text-brand-purple-light">BUILDER</span></span>
          </a>
          <div className="flex items-center gap-4">
            {profile?.is_admin && <a href="/admin" className="text-xs text-brand-purple-light hover:text-white transition-colors">Admin Panel</a>}
            <span className="text-xs text-brand-text-dim hidden sm:block">{user?.email}</span>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              className="text-xs text-brand-text-muted hover:text-white transition-colors">Sign Out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-brand-text-muted mt-1">
              {profile?.is_authorized
                ? `${profile?.generation_count || 0} generations completed`
                : 'Your account is pending authorization.'}
            </p>
          </div>
          {profile?.is_authorized && (
            <div className="flex gap-3">
              {Object.values(SYSTEMS).map(sys => (
                <a key={sys.id} href={`/system?system=${sys.id}`}
                  className="btn btn-secondary text-xs px-3 py-2">
                  {sys.icon} {sys.label.split(' ')[0]}
                </a>
              ))}
            </div>
          )}
        </div>

        {!profile?.is_authorized ? (
          <div className="card p-10 text-center max-w-md mx-auto">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="font-bold text-xl text-white mb-3">Pending Authorization</h2>
            <p className="text-brand-text-muted text-sm">TurboBuilder is in private beta. The owner needs to authorize your account before you can generate.</p>
          </div>
        ) : (
          <>
            {/* System cards */}
            <div className="mb-12">
              <h2 className="font-semibold text-lg text-white mb-4">New Generation</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(SYSTEMS).map(sys => (
                  <a key={sys.id} href={`/system?system=${sys.id}`}
                    className="card card-hover p-6 flex items-center gap-4 cursor-pointer">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${sys.color}20`, border: `1px solid ${sys.color}40` }}>
                      {sys.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{sys.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: sys.colorLight }}>{sys.tagline}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Generation history */}
            {generations.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg text-white mb-4">Generation History</h2>
                <div className="space-y-3">
                  {generations.map(gen => {
                    const sys = SYSTEMS[gen.system_type as keyof typeof SYSTEMS]
                    const qs = gen.output_metadata?.qualityScore
                    return (
                      <div key={gen.id} className="card p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="text-xl flex-shrink-0 mt-0.5">{sys?.icon || '📦'}</span>
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate font-medium">{gen.prompt}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-brand-text-dim">{sys?.label}</span>
                                <span className="text-brand-text-dim">·</span>
                                <span className="text-xs text-brand-text-dim">{new Date(gen.created_at).toLocaleDateString('en-GB')}</span>
                                {qs && <span className={`text-xs font-semibold ${qualityColor(qs)}`}>{qs}/100 — {qualityLabel(qs)}</span>}
                              </div>
                              {/* Star rating */}
                              {gen.status === 'complete' && (
                                <div className="flex gap-1 mt-2">
                                  {[1,2,3,4,5].map(star => (
                                    <button key={star} onClick={() => rateGen(gen.id, star)}
                                      className={`text-sm transition-colors ${(gen.rating || 0) >= star ? 'text-brand-orange' : 'text-brand-border hover:text-brand-orange'}`}>
                                      ★
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={statusBadge[gen.status] || 'badge badge-orange'}>{gen.status}</span>
                            {gen.status !== 'complete' && gen.status !== 'failed' && (
                              <a href={`/system?system=${gen.system_type}&watch=${gen.id}`}
                                className="btn btn-secondary text-xs px-3 py-1.5">Watch</a>
                            )}
                            {gen.output_url && (
                              <a href={gen.output_url} download
                                className="btn btn-secondary text-xs px-3 py-1.5">Download</a>
                            )}
                            <button onClick={() => regen(gen)}
                              className="btn btn-secondary text-xs px-3 py-1.5">↺ Regen</button>
                          </div>
                        </div>
                        {/* Progress bar for active generations */}
                        {gen.status !== 'complete' && gen.status !== 'failed' && gen.progress > 0 && (
                          <div className="mt-3 w-full bg-brand-surface rounded-full h-1.5 overflow-hidden">
                            <div className="progress-bar h-full" style={{ width: `${gen.progress}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

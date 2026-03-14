'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SYSTEMS } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface Profile { is_authorized: boolean; is_admin: boolean; full_name: string | null; generation_count: number }
interface Generation { id: string; system_type: string; prompt: string; status: string; progress: number; created_at: string; output_url: string | null }

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: gens } = await supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      setGenerations(gens || [])
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-brand-purple border-t-transparent animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs text-brand-text-dim">Loading...</p>
      </div>
    </main>
  )

  const statusColor: Record<string,string> = {
    queued:'text-brand-text-dim',
    researching:'text-brand-cyan',
    generating:'text-brand-purple-light',
    complete:'text-brand-green',
    failed:'text-brand-red',
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border/50 backdrop-blur-xl bg-brand-bg/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center shadow-glow-sm">
              <span className="text-white font-display font-bold text-sm">T</span>
            </div>
            <span className="font-display font-bold text-lg text-brand-text">TURBO<span className="text-brand-purple-light">BUILDER</span></span>
          </a>
          <div className="flex items-center gap-4">
            {profile?.is_admin && (
              <a href="/admin" className="text-xs font-mono text-brand-purple-light hover:text-brand-purple transition-colors">Admin Panel</a>
            )}
            <span className="text-xs font-mono text-brand-text-dim">{user?.email}</span>
            <button onClick={signOut} className="text-xs text-brand-text-muted hover:text-brand-text transition-colors">Sign Out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-black text-4xl text-brand-text mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="font-body text-brand-text-muted">
            {profile?.is_authorized
              ? `${profile.generation_count || 0} generations completed`
              : 'Your account is pending authorization. Contact the owner to get access.'}
          </p>
        </div>

        {!profile?.is_authorized ? (
          <div className="card p-10 text-center max-w-lg mx-auto">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="font-display font-bold text-xl text-brand-text mb-3">Pending Authorization</h2>
            <p className="font-body text-brand-text-muted text-sm leading-relaxed">
              TurboBuilder is in private beta. Your account has been created but needs to be authorized by the owner before you can generate assets.
            </p>
          </div>
        ) : (
          <>
            {/* System Select */}
            <div className="mb-16">
              <h2 className="font-display font-semibold text-xl text-brand-text mb-6">New Generation</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(SYSTEMS).map(sys => (
                  <a
                    key={sys.id}
                    href={`/system?type=${sys.id}`}
                    className="card p-6 flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110" style={{background:`${sys.color}20`,border:`1px solid ${sys.color}40`}}>{sys.icon}</div>
                    <div>
                      <h3 className="font-display font-semibold text-brand-text text-sm">{sys.label}</h3>
                      <p className="font-mono text-xs mt-0.5" style={{color:sys.colorLight}}>{sys.tagline}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Recent Generations */}
            {generations.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-xl text-brand-text mb-6">Recent Generations</h2>
                <div className="space-y-3">
                  {generations.map(gen => {
                    const sys = SYSTEMS[gen.system_type as keyof typeof SYSTEMS]
                    return (
                      <div key={gen.id} className="card p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xl">{sys?.icon || '📦'}</span>
                          <div>
                            <p className="font-body text-sm text-brand-text truncate max-w-xs">{gen.prompt}</p>
                            <p className="font-mono text-xs text-brand-text-dim mt-0.5">{sys?.label} · {new Date(gen.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className={`font-mono text-xs uppercase ${statusColor[gen.status] || 'text-brand-text-dim'}`}>{gen.status}</span>
                          {gen.status === 'generating' && (
                            <div className="w-24 h-1.5 bg-brand-border rounded-full overflow-hidden">
                              <div className="progress-bar h-full rounded-full" style={{width:`${gen.progress}%`}} />
                            </div>
                          )}
                          {gen.output_url && (
                            <a href={gen.output_url} download className="btn-secondary px-3 py-1.5 rounded-lg text-xs">Download</a>
                          )}
                          {gen.status !== 'complete' && gen.status !== 'failed' && (
                            <a href={`/system?generationId=${gen.id}&type=${gen.system_type}`} className="btn-secondary px-3 py-1.5 rounded-lg text-xs">View</a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

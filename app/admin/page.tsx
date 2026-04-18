'use client'
// app/admin/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }

      const [
        { count: userCount },
        { count: genCount },
        { count: scriptCount },
        { count: waitlistCount },
        { count: knowledgeCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('generations').select('*', { count: 'exact', head: true }),
        supabase.from('script_library').select('*', { count: 'exact', head: true }),
        supabase.from('waitlist').select('*', { count: 'exact', head: true }),
        supabase.from('ai_knowledge').select('*', { count: 'exact', head: true }),
      ])
      setStats({ userCount, genCount, scriptCount, waitlistCount, knowledgeCount })
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
    </div>
  )

  const tiles = [
    { href: '/admin/knowledge-base', icon: '📚', label: 'Knowledge Base', desc: 'Edit AI generation knowledge', badge: null },
    { href: '/admin/research', icon: '🔬', label: 'Research Queue', desc: 'Add new building/vehicle research', badge: stats?.knowledgeCount },
    { href: '/admin/library', icon: '💾', label: 'Script Library', desc: 'View auto-generated scripts', badge: stats?.scriptCount },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-brand-text-muted hover:text-white transition-colors text-sm">← Dashboard</a>
            <span className="text-brand-border">|</span>
            <span className="font-bold text-white">Admin Panel</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-brand-text-muted mb-10">TurboBuilder management console</p>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { label: 'Users', value: stats.userCount },
              { label: 'Generations', value: stats.genCount },
              { label: 'Scripts', value: stats.scriptCount },
              { label: 'Waitlist', value: stats.waitlistCount },
              { label: 'KB Entries', value: stats.knowledgeCount },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <p className="text-3xl font-bold text-white">{s.value ?? '–'}</p>
                <p className="text-xs text-brand-text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiles.map(t => (
            <a key={t.href} href={t.href} className="card card-hover p-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-3xl">{t.icon}</p>
                {t.badge != null && (
                  <span className="text-xs font-mono text-brand-text-muted bg-brand-surface px-2 py-0.5 rounded-lg border border-brand-border">
                    {t.badge}
                  </span>
                )}
              </div>
              <p className="font-semibold text-white mb-1">{t.label}</p>
              <p className="text-xs text-brand-text-muted">{t.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email for a confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-8">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TurboBuilder</h1>
          <p className="text-brand-text-muted text-sm mt-1">AI-powered Roblox asset generation</p>
        </div>

        <div className="flex gap-1 p-1 bg-brand-surface rounded-xl mb-6">
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${mode === m ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'}`}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white placeholder-brand-text-dim outline-none focus:border-brand-purple transition-colors text-sm" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white placeholder-brand-text-dim outline-none focus:border-brand-purple transition-colors text-sm" />
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        {success && <p className="text-green-400 text-sm mt-3">{success}</p>}

        <button onClick={handleSubmit} disabled={loading || !email || !password}
          className="mt-6 w-full py-3 rounded-xl bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-40 text-white font-bold text-sm transition-all">
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}

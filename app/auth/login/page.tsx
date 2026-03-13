'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSignup = searchParams.get('signup') === 'true'
  const [mode, setMode] = useState<'login'|'signup'>(isSignup ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      })
      if (error) setError(error.message)
      else setSuccess('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-brand-bg grid-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center shadow-glow-sm">
              <span className="text-white font-display font-bold">T</span>
            </div>
            <span className="font-display font-bold text-2xl text-brand-text">TURBO<span className="text-brand-purple-light">BUILDER</span></span>
          </a>
          <h1 className="font-display font-bold text-2xl text-brand-text mb-2">
            {mode === 'login' ? 'Welcome back' : 'Request Beta Access'}
          </h1>
          <p className="font-body text-sm text-brand-text-muted">
            {mode === 'login' ? 'Sign in to continue building' : 'Create an account — owner will authorize you'}
          </p>
        </div>

        <div className="card p-8">
          <button onClick={handleGoogle} disabled={loading} className="w-full py-3 rounded-xl border border-brand-border text-brand-text font-body text-sm hover:border-brand-purple/40 hover:bg-brand-surface transition-all flex items-center justify-center gap-3 mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="font-mono text-xs text-brand-text-dim">OR</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block font-body text-xs text-brand-text-muted mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="input w-full px-4 py-3 rounded-xl text-sm" />
              </div>
            )}
            <div>
              <label className="block font-body text-xs text-brand-text-muted mb-1.5">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="input w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block font-body text-xs text-brand-text-muted mb-1.5">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="input w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            {error && <div className="p-3 rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm font-body">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm font-body">{success}</div>}
            <button onClick={handleEmail} disabled={loading} className="btn-primary w-full py-3 rounded-xl text-sm mt-2">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <p className="text-center font-body text-sm text-brand-text-muted mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode==='login'?'signup':'login'); setError(''); setSuccess('') }} className="text-brand-purple-light hover:text-brand-purple transition-colors">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-brand-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" /></main>}>
      <LoginForm />
    </Suspense>
  )
}

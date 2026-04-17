'use client'
// app/waitlist/page.tsx
import { useState } from 'react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim() || !name.trim()) {
      setError('Please fill in your name and email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      if (data.alreadySubmitted) {
        setAlreadyDone(true)
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="font-bold text-xl text-white">
              TURBO<span className="text-brand-purple-light">BUILDER</span>
            </span>
          </a>
          <h1 className="text-3xl font-bold text-white mb-3">Request Beta Access</h1>
          <p className="text-brand-text-muted">
            TurboBuilder is in private beta. Tell us about yourself and we'll be in touch.
          </p>
        </div>

        {done ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-4">{alreadyDone ? '👋' : '🎉'}</div>
            <h2 className="font-bold text-xl text-white mb-3">
              {alreadyDone ? "You're already on the list!" : "You're on the list!"}
            </h2>
            <p className="text-brand-text-muted text-sm mb-6">
              {alreadyDone
                ? "We already have your request — we'll be in touch soon."
                : "We'll review your request and get back to you. Keep an eye on your inbox."}
            </p>
            <a href="/" className="btn btn-secondary px-6 py-2.5 text-sm inline-block">
              Back to Home
            </a>
          </div>
        ) : (
          <div className="card p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                  What do you want to build? (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Police roleplay server, emergency services pack, full city map..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !email.trim() || !name.trim()}
              className="btn btn-primary w-full mt-6 py-3 text-sm"
            >
              {loading ? 'Submitting…' : 'Request Access →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SYSTEMS, type SystemType } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <main className="bg-brand-bg min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border/50 backdrop-blur-xl bg-brand-bg/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center shadow-glow-sm">
              <span className="text-white font-display font-bold text-sm">T</span>
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-brand-text">
              TURBO<span className="text-brand-purple-light">BUILDER</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/auth/login" className="text-sm text-brand-text-muted hover:text-brand-text transition-colors font-body">Sign In</a>
            <a href="/auth/login?signup=true" className="btn-primary px-4 py-2 rounded-lg text-sm">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg pt-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-purple/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-brand-cyan/6 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge mb-10 animate-fade-up s1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            <span className="font-mono text-xs text-brand-purple-light tracking-widest uppercase">AI-Powered Roblox Development</span>
          </div>
          <h1 className="font-display font-black tracking-tight leading-none mb-6 animate-fade-up s2">
            <span className="block text-7xl md:text-9xl text-brand-text">TURBO</span>
            <span className="block text-7xl md:text-9xl gradient-text">BUILDER</span>
          </h1>
          <p className="font-body text-brand-text-muted max-w-2xl mx-auto text-lg leading-relaxed mb-10 animate-fade-up s3">
            The AI creation suite for Roblox Studio. Generate complete environments, scripted vehicles, and entire game maps — exported as drag-and-drop .rbxmx files.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up s4">
            <a href="/auth/login?signup=true" className="btn-primary px-8 py-4 rounded-xl text-base">Start Building Free →</a>
            <a href="#systems" className="btn-secondary px-8 py-4 rounded-xl text-base">Explore Systems</a>
          </div>
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fade-up s5">
            {[{v:'3',l:'AI Systems'},{v:'∞',l:'Asset Types'},{v:'<5min',l:'Avg Generation'}].map(s => (
              <div key={s.l} className="text-center">
                <div className="font-display font-black text-3xl text-brand-purple-light">{s.v}</div>
                <div className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Systems */}
      <section id="systems" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge px-4 py-1.5 rounded-full text-xs inline-block mb-4">THREE AI SYSTEMS</span>
            <h2 className="font-display font-black text-5xl text-brand-text mb-4">Choose Your <span className="gradient-text">Creation Mode</span></h2>
            <p className="font-body text-brand-text-muted max-w-xl mx-auto">Each system is purpose-built for a different part of your game.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(SYSTEMS).map((sys) => (
              <div
                key={sys.id}
                className="card p-8 flex flex-col cursor-pointer"
                onMouseEnter={() => setHovered(sys.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 hover:scale-110" style={{background:`${sys.color}20`,border:`1px solid ${sys.color}40`}}>{sys.icon}</div>
                  <span className="badge px-3 py-1 rounded-full text-xs" style={{color:sys.colorLight,borderColor:`${sys.color}40`,background:`${sys.color}15`}}>{sys.badge}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-brand-text mb-1">{sys.label}</h3>
                <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{color:sys.colorLight}}>{sys.tagline}</p>
                <p className="font-body text-sm text-brand-text-muted leading-relaxed mb-6 flex-1">{sys.description}</p>
                <div className="mb-8">
                  <p className="font-mono text-xs text-brand-text-dim uppercase tracking-widest mb-3">Examples</p>
                  <div className="space-y-1.5">
                    {sys.examples.slice(0,3).map(ex => (
                      <div key={ex} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{background:sys.color}} />
                        <span className="font-body text-xs text-brand-text-muted">{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <a
                  href="/auth/login?signup=true"
                  className="w-full py-3 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-200 text-center block"
                  style={{background:hovered===sys.id?sys.color:`${sys.color}20`,border:`1px solid ${hovered===sys.id?sys.color:sys.color+'40'}`,color:hovered===sys.id?'white':sys.colorLight,boxShadow:hovered===sys.id?`0 0 20px ${sys.color}40`:'none'}}
                >
                  Select System →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 border-t border-brand-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-5xl text-brand-text mb-4">Built for <span className="gradient-text">Serious Developers</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {icon:'🔬',t:'Research Engine',d:'Before every build, our AI searches for reference designs and tutorials to ensure maximum accuracy.'},
              {icon:'✅',t:'Quality Checker',d:'A second AI pass inspects every generation for completeness, accuracy, and production quality.'},
              {icon:'🎨',t:'Smart Materials',d:'Intelligent material selection — the right textures applied to every surface automatically.'},
              {icon:'⚡',t:'Real-Time Progress',d:'Watch your build come together live with a live spec panel and progress tracker.'},
              {icon:'📦',t:'.rbxmx Output',d:'Every asset exports as a Roblox Studio-compatible file — drag in and play immediately.'},
              {icon:'🔒',t:'Authorized Access',d:'Beta access is invite-only. The owner authorizes each user directly for quality control.'},
            ].map(f => (
              <div key={f.t} className="p-6 rounded-2xl border border-brand-border/50 bg-brand-surface/40 hover:border-brand-purple/30 transition-all group">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="font-display font-semibold text-base text-brand-text mb-2">{f.t}</h3>
                <p className="font-body text-sm text-brand-text-muted leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/8 to-transparent">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-brand-purple to-transparent" />
            <h2 className="font-display font-black text-5xl text-brand-text mb-4">Start Building Today</h2>
            <p className="font-body text-brand-text-muted mb-8 text-lg">Request beta access and start generating in minutes.</p>
            <a href="/auth/login?signup=true" className="btn-primary px-10 py-4 rounded-xl text-base font-display inline-block">Request Beta Access →</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border/30 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-sm text-brand-text-muted">TURBOBUILDER</span>
          <p className="font-body text-xs text-brand-text-dim">© 2025 TurboBuilder. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-white">TURBO<span className="text-brand-purple-light">BUILDER</span></span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/waitlist" className="btn btn-secondary text-sm px-4 py-2">Request Access</a>
            <a href="/auth/login" className="btn btn-primary text-sm px-4 py-2">Sign In</a>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-32 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="badge badge-purple mb-8">⚡ Innovating Development</div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Build Roblox assets<br /><span className="text-brand-purple-light">with AI</span>
          </h1>
          <p className="text-xl text-brand-text-muted mb-10 max-w-2xl mx-auto">
            Generate prestige-quality buildings, vehicles, weapons, and full maps. Multi-pass AI with veteran knowledge baked in.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/waitlist" className="btn btn-primary text-base px-8 py-3.5">Request Beta Access →</a>
            <a href="/auth/login" className="btn btn-secondary text-base px-8 py-3.5">Sign In</a>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Three powerful systems</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🏗️', label: 'Builder System', desc: 'Police stations, fire stations, hospitals, shops — fully furnished with interiors, scripts, and lighting.', color: '#7C3AED' },
              { icon: '🚗', label: 'Modeling System', desc: 'Vehicles with ELS & sirens, firearms, tools, handcuffs — complete with working Luau scripts.', color: '#06B6D4' },
              { icon: '🗺️', label: 'Project System', desc: 'Full city maps, emergency services packs, coordinated multi-asset collections.', color: '#10B981' },
            ].map(s => (
              <div key={s.label} className="card p-6">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.label}</h3>
                <p className="text-brand-text-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Prestige quality, every time</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '🔬', label: 'Multi-Pass Generation', desc: 'Structure → Interior → Scripts → Materials — four specialist AI passes for maximum quality' },
              { icon: '🤖', label: 'Specialist Sub-Agents', desc: 'Separate AI agent per area: structure, interior, scripts, and material refinement' },
              { icon: '🔍', label: 'Research Bot', desc: 'Searches the web for references before every generation for context-accurate results' },
              { icon: '⭐', label: 'Quality Checker', desc: 'Scores every output 0-100 and auto-retries if quality falls below 65' },
              { icon: '📚', label: 'Self-Learning Library', desc: 'Saves generated scripts and reuses them in future builds — gets smarter over time' },
              { icon: '🎨', label: 'Style & Size Presets', desc: 'Choose Modern, Victorian, Brutalist and more. Set size from Small to Massive.' },
              { icon: '🔄', label: 'Variation Generator', desc: 'Generate 3 versions of the same prompt and pick your favourite' },
              { icon: '📦', label: 'Roblox Ready', desc: '.rbxmx files drag straight into Studio — no conversion needed' },
            ].map(f => (
              <div key={f.label} className="card p-5 flex gap-4">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="font-semibold text-white text-sm">{f.label}</p>
                  <p className="text-brand-text-muted text-xs mt-1">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center border-t border-brand-border">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to build at prestige level?</h2>
        <p className="text-brand-text-muted mb-8">Private beta — request access today.</p>
        <a href="/waitlist" className="btn btn-primary text-base px-8 py-3.5 inline-block">Request Beta Access →</a>
      </section>

      <footer className="border-t border-brand-border py-8 text-center text-brand-text-dim text-sm">
        © 2026 TurboBuilder — Innovating Development
      </footer>
    </main>
  )
}

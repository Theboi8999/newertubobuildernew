'use client'

import { useRef, useState } from 'react'

interface AnalysisResult {
  analysis: string
  changes: string[]
}

function ImageUpload({
  label,
  image,
  onImage,
}: {
  label: string
  image: string | null
  onImage: (b64: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      // Strip the data URL prefix — we only want the raw base64
      onImage(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="flex-1 min-w-0 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors overflow-hidden"
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {image ? (
        <img
          src={`data:image/jpeg;base64,${image}`}
          alt={label}
          className="w-full h-64 object-cover"
        />
      ) : (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500 p-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs">Click or drag & drop</span>
        </div>
      )}
      <div className="px-3 py-2 bg-gray-800 text-center text-xs text-gray-400 font-medium">
        {label}
      </div>
    </div>
  )
}

export default function VisualFixPage() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [targetImage, setTargetImage] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function analyze() {
    if (!generatedImage || !targetImage) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/visual-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedImage, targetImage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyChanges() {
    if (!result) return
    const text = result.changes.map(c => `CHANGE: ${c}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <a href="/" className="text-gray-500 hover:text-gray-300 text-sm">← TurboBuilder</a>
          </div>
          <h1 className="text-3xl font-bold">Visual Fix System</h1>
          <p className="text-gray-400 mt-2">
            Upload a screenshot of the generated building and the target. Claude Vision will identify the differences and suggest exact code fixes.
          </p>
        </div>

        {/* Upload row */}
        <div className="flex gap-4 mb-6">
          <ImageUpload label="Generated Building" image={generatedImage} onImage={setGeneratedImage} />
          <ImageUpload label="Target Building" image={targetImage} onImage={setTargetImage} />
        </div>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={!generatedImage || !targetImage || loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analysing with Claude Vision...' : 'Analyze Differences'}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Change list */}
            {result.changes.length > 0 && (
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
                  <span className="font-semibold text-sm">
                    {result.changes.length} suggested fix{result.changes.length !== 1 ? 'es' : ''}
                  </span>
                  <button
                    onClick={copyChanges}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy all changes'}
                  </button>
                </div>
                <ul className="divide-y divide-gray-800">
                  {result.changes.map((c, i) => {
                    const [from, to] = c.split(' → ')
                    return (
                      <li key={i} className="px-4 py-3 flex items-start gap-3 text-sm">
                        <span className="shrink-0 text-gray-500 w-5 text-right">{i + 1}.</span>
                        <span className="text-gray-300">{from}</span>
                        {to && (
                          <>
                            <span className="text-gray-600 shrink-0">→</span>
                            <span className="text-green-400 font-mono">{to}</span>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Full analysis */}
            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-800 font-semibold text-sm">Full analysis</div>
              <pre className="px-4 py-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-[500px]">
                {result.analysis}
              </pre>
            </div>

            {/* Apply Fix instructions */}
            <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/20 p-4">
              <p className="text-sm font-semibold text-yellow-400 mb-2">Apply Fix</p>
              <p className="text-sm text-yellow-200/70">
                Copy the changes above and update <code className="font-mono bg-gray-800 px-1 rounded">lib/lua-generator.ts</code>,
                then run:
              </p>
              <code className="block mt-2 text-xs font-mono bg-gray-900 rounded px-3 py-2 text-green-400">
                npm run build && git add . && git commit -m &quot;Visual fix applied&quot; && git push
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

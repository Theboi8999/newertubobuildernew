'use client'
import { useState, useRef, useEffect } from 'react'
import { BuildIntent, createDefaultIntent, estimateGeneration } from '../lib/brain/build-intent'

interface Message {
  role: 'user' | 'turbo'
  content: string
}

interface TurboChatProps {
  onGenerate: (intent: BuildIntent) => void
  isGenerating: boolean
}

export default function TurboChat({ onGenerate, isGenerating }: TurboChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'turbo', content: 'What do you want to build today?' }
  ])
  const [input, setInput] = useState('')
  const [intent, setIntent] = useState<BuildIntent>(createDefaultIntent(''))
  const [mode, setMode] = useState<'exterior' | 'full'>('exterior')
  const [scenery, setScenery] = useState<string>('minimal')
  const [furniture, setFurniture] = useState<string>('simple')
  const [hasStaircases, setHasStaircases] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    const history = messages.map(m => ({
      role: m.role === 'turbo' ? 'assistant' : 'user',
      content: m.content,
    }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, intent, history }),
      })
      const data = await res.json()

      setIntent(data.intent)
      setMessages(prev => [...prev, { role: 'turbo', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'turbo', content: 'Something went wrong. Try again!' }])
    }
  }

  const handleGenerate = () => {
    const finalIntent: BuildIntent = {
      ...intent,
      mode,
      scenery: scenery as BuildIntent['scenery'],
      furniture: furniture as BuildIntent['furniture'],
      hasStaircases,
      complete: true,
    }
    onGenerate(finalIntent)
  }

  const est = estimateGeneration({
    ...intent,
    mode,
    scenery: scenery as BuildIntent['scenery'],
    furniture: furniture as BuildIntent['furniture'],
    hasStaircases,
  })

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-700">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}>
              {msg.role === 'turbo' && <span className="text-xs text-gray-400 block mb-1">Turbo</span>}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Describe what you want to build..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => sendMessage(input)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            Send
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Mode</label>
            <div className="flex gap-2">
              {(['exterior', 'full'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    mode === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {m === 'exterior' ? 'Exterior Only' : 'Full Building'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Scenery</label>
            <select
              value={scenery}
              onChange={e => setScenery(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="none">None (building only) +0 parts</option>
              <option value="minimal">Minimal (ground + kerb) +20 parts</option>
              <option value="street">Street (road + pavement) +60 parts</option>
              <option value="residential">Residential (lawn + driveway + fence) +120 parts</option>
              <option value="commercial">Commercial (carpark + road) +100 parts</option>
              <option value="full">Full Scene (everything) +250 parts</option>
            </select>
          </div>

          {mode === 'full' && (
            <div className="space-y-2 border border-gray-700 rounded-lg p-3">
              <label className="text-xs text-gray-400 block font-medium">Interior Options</label>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Furniture</span>
                <select
                  value={furniture}
                  onChange={e => setFurniture(e.target.value)}
                  className="bg-gray-800 text-white rounded px-2 py-1 text-sm border border-gray-600"
                >
                  <option value="none">None</option>
                  <option value="simple">Simple</option>
                  <option value="full">Full</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Staircases</span>
                <button
                  onClick={() => setHasStaircases(!hasStaircases)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${hasStaircases ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${hasStaircases ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Ceiling</span>
                <button
                  onClick={() => setIntent(prev => ({ ...prev, hasCeiling: !prev.hasCeiling }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${intent.hasCeiling ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${intent.hasCeiling ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{est.description}</span>
              {intent.buildingType && <span className="text-blue-400 capitalize">{intent.buildingType}</span>}
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

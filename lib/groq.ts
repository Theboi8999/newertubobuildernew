// lib/groq.ts
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function callGroq(system: string, prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: Math.min(maxTokens, 1500),
      temperature: 0.3,
      messages: [
        { role: 'system', content: system.slice(0, 1000) },
        { role: 'user', content: prompt.slice(0, 1500) },
      ],
    }),
  })

  if (res.status === 429) {
    throw Object.assign(new Error('Groq rate limit (429)'), { status: 429 })
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq API error: ${res.status} ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq returned empty content')
  return content
}

export async function groqGenerate(
  system: string,
  prompt: string,
  maxTokens = 2000,
  retries = 3,
): Promise<string> {
  const backoffs = [0, 3000, 6000]
  let lastError: Error = new Error('Unknown groq error')

  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        const extra = (lastError as any).status === 429 ? 5000 : 0
        await new Promise(r => setTimeout(r, backoffs[i] + extra))
      }
      return await callGroq(system, prompt, maxTokens)
    } catch (err: any) {
      lastError = err
      console.error(`[groq] attempt ${i + 1}/${retries} failed:`, err.message)
    }
  }

  throw lastError
}

export async function groqJSON<T>(system: string, prompt: string, fallback: T): Promise<T> {
  try {
    const raw = await groqGenerate(system, prompt, 1500)
    const stripped = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/m, '').trim()
    const start = stripped.indexOf('{')
    const end = stripped.lastIndexOf('}')
    if (start === -1 || end === -1) {
      console.error('[groqJSON] no JSON object found in response')
      return fallback
    }
    return JSON.parse(stripped.slice(start, end + 1)) as T
  } catch (e) {
    console.error('[groqJSON] parse error:', e)
    return fallback
  }
}

// Backward-compat alias — generator.ts non-builder path uses this
export const geminiGenerate = groqGenerate

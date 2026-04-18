// lib/groq.ts
// Wraps the Groq API (llama-3.1-8b-instant).
// The function was historically named geminiGenerate — kept for import compatibility
// but aliased clearly. Retry logic added to handle transient Groq failures.

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
      max_tokens: Math.min(maxTokens, 4000),
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq API error: ${res.status} ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq returned empty content')
  return content
}

export async function geminiGenerate(
  system: string,
  prompt: string,
  maxTokens: number = 8000
): Promise<string> {
  const MAX_RETRIES = 3
  let lastError: Error = new Error('Unknown error')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGroq(system, prompt, maxTokens)
    } catch (err: any) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s
        await new Promise(r => setTimeout(r, attempt * 1000))
      }
    }
  }

  throw lastError
}

// Named alias for new code — prefer this in new imports
export const groqGenerate = geminiGenerate

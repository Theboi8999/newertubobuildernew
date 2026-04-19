import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function groqGenerate(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500
): Promise<string> {
  const truncSys = systemPrompt.substring(0, 800)
  const truncUser = userPrompt.substring(0, 1500)

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        const delay = attempt * 4000
        console.log(`[groq] retry ${attempt}, waiting ${delay}ms`)
        await new Promise(r => setTimeout(r, delay))
      }
      const res = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        max_tokens: Math.min(maxTokens, 1500),
        temperature: 0.3,
        messages: [
          { role: 'system', content: truncSys },
          { role: 'user', content: truncUser }
        ]
      })
      const text = res.choices[0]?.message?.content || ''
      console.log(`[groq] success attempt ${attempt + 1}, chars: ${text.length}`)
      return text
    } catch (err: any) {
      console.error(`[groq] attempt ${attempt + 1} failed:`, err?.status, err?.message?.substring(0, 100))
      if (err?.status === 429) {
        await new Promise(r => setTimeout(r, 6000 + attempt * 3000))
        continue
      }
      if (attempt === 2) throw err
    }
  }
  throw new Error('groq: all retries failed')
}

export async function groqJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  fallback: T
): Promise<T> {
  try {
    const raw = await groqGenerate(systemPrompt, userPrompt)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) {
      console.error('[groq] no JSON in response:', cleaned.substring(0, 300))
      return fallback
    }
    const parsed = JSON.parse(cleaned.substring(start, end + 1))
    console.log('[groq] JSON ok, keys:', Object.keys(parsed).join(', '))
    return parsed as T
  } catch (e) {
    console.error('[groq] JSON parse failed:', e)
    return fallback
  }
}

// Backward-compat alias — generator.ts non-builder path uses this
export const geminiGenerate = groqGenerate

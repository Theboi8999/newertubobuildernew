const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function geminiGenerate(system: string, prompt: string, maxTokens: number = 8000): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // faster, more instruction-following
      max_tokens: Math.min(maxTokens, 6000),
      temperature: 0.2, // low temp = more consistent JSON output
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Groq API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

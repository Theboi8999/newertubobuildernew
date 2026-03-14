export async function researchPrompt(prompt: string): Promise<string> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) return ''
  try {
    const q = encodeURIComponent(`Roblox Studio ${prompt} build reference tutorial`)
    const res = await fetch(`https://serpapi.com/search.json?q=${q}&num=5&api_key=${apiKey}`)
    if (!res.ok) return ''
    const data = await res.json()
    const results = (data.organic_results || []).slice(0, 5)
    if (!results.length) return ''
    return '\nWEB RESEARCH:\n' + results.map((r: any) => `- ${r.title}: ${r.snippet}`).join('\n') + '\n'
  } catch { return '' }
}

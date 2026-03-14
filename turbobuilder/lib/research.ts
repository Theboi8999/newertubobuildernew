// Research engine — searches web for reference data before generation

export interface ResearchResult {
  query: string
  references: string[]
  summary: string
}

export async function researchTopic(prompt: string, systemType: string): Promise<ResearchResult> {
  const queries = buildQueries(prompt, systemType)
  const references: string[] = []

  try {
    for (const query of queries.slice(0, 3)) {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=5`
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const results = data.organic_results || []
      for (const r of results.slice(0, 2)) {
        if (r.snippet) references.push(`[${r.title}]: ${r.snippet}`)
      }
    }
  } catch (e) {
    console.error('Research error:', e)
  }

  return {
    query: queries[0],
    references,
    summary: references.slice(0, 6).join('\n'),
  }
}

function buildQueries(prompt: string, systemType: string): string[] {
  const base = prompt.toLowerCase()
  if (systemType === 'builder') {
    return [
      `Roblox Studio ${base} building design reference`,
      `${base} architecture layout dimensions`,
      `Roblox ${base} interior design`,
    ]
  } else if (systemType === 'modeling') {
    return [
      `Roblox Studio ${base} vehicle script ELS`,
      `${base} Luau script Roblox model`,
      `Roblox ${base} scripted tool`,
    ]
  } else {
    return [
      `Roblox roleplay map ${base}`,
      `${base} city layout design reference`,
      `Roblox Studio ${base} game world`,
    ]
  }
}

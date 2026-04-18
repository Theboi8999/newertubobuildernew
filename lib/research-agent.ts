// lib/research-agent.ts
import { createAdminClient } from './supabase'
import { geminiGenerate } from './groq'

export interface ResearchRoom {
  name: string
  width: number
  depth: number
  height: number
  furniture: Array<{
    name: string
    size: { x: number; y: number; z: number }
    color: string
    material: string
  }>
  wallColor: string
  floorColor: string
  floorMaterial: string
}

export interface ResearchResult {
  buildingType: string
  rooms: ResearchRoom[]
  totalWidth: number
  totalDepth: number
  exteriorColor: string
  roofColor: string
  culturalNotes: string
  confidence: number
}

const FALLBACK_RESULT = (buildingType: string): ResearchResult => ({
  buildingType,
  rooms: [
    { name: 'Main Hall', width: 20, depth: 15, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
    { name: 'Office', width: 10, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'Wood' },
  ],
  totalWidth: 40,
  totalDepth: 30,
  exteriorColor: 'Light grey',
  roofColor: 'Dark grey',
  culturalNotes: '',
  confidence: 0,
})

export async function researchBuildingType(buildingType: string, forceRefresh = false): Promise<ResearchResult> {
  const supabase = createAdminClient()

  // Step 1: Check cache
  if (!forceRefresh) {
    try {
      const { data: cached } = await supabase
        .from('research_cache')
        .select('structured_knowledge, confidence_score, last_researched_at')
        .eq('building_type', buildingType)
        .single()

      if (cached?.structured_knowledge && cached.confidence_score >= 70) {
        const ageMs = Date.now() - new Date(cached.last_researched_at).getTime()
        if (ageMs < 30 * 24 * 60 * 60 * 1000) {
          return cached.structured_knowledge as ResearchResult
        }
      }
    } catch { /* not cached */ }
  }

  let combinedResearch = ''

  // Step 2: Wikipedia summary
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(buildingType)}`,
      { headers: { 'User-Agent': 'TurboBuilder/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.extract) combinedResearch += `Wikipedia: ${data.extract}\n\n`
    }
  } catch (e) {
    console.error('[researchBuildingType] Wikipedia summary error:', e)
  }

  // Wikipedia wikitext for room/area mentions
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(buildingType)}&prop=revisions&rvprop=content&format=json&rvslots=main&origin=*`
    )
    if (res.ok) {
      const data = await res.json()
      const pages = data.query?.pages || {}
      const page: any = Object.values(pages)[0]
      const wikitext: string = page?.revisions?.[0]?.slots?.main?.['*'] || ''
      const roomMatches = wikitext.match(
        /\b(room|floor|area|hall|office|cell|bay|ward|wing|suite|lobby|corridor|department)\b[^.]{0,120}/gi
      ) || []
      if (roomMatches.length > 0) {
        combinedResearch += `Wikipedia rooms/areas: ${roomMatches.slice(0, 15).join('. ')}\n\n`
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Wikipedia detail error:', e)
  }

  // Step 3: Tavily
  try {
    if (process.env.TAVILY_API_KEY) {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${buildingType} interior layout rooms floor plan architecture`,
          search_depth: 'advanced',
          max_results: 5,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.results || []).map((r: any) => r.content || '').join('\n')
        if (text) combinedResearch += `Tavily:\n${text}\n\n`
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Tavily error:', e)
  }

  // Step 4: Serper
  try {
    if (process.env.SERPER_API_KEY) {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.SERPER_API_KEY!,
        },
        body: JSON.stringify({
          q: `${buildingType} rooms list interior layout typical`,
          num: 5,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.organic || []).map((r: any) => r.snippet || '').join('\n')
        if (text) combinedResearch += `Serper:\n${text}\n\n`
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Serper error:', e)
  }

  if (!combinedResearch.trim()) {
    return FALLBACK_RESULT(buildingType)
  }

  // Step 5: Synthesise with Groq
  let result: ResearchResult = FALLBACK_RESULT(buildingType)

  try {
    const systemPrompt = `You are an expert architect and Roblox game developer. Given research about a building type, extract structured layout data. Respond ONLY with valid JSON matching this exact schema, no markdown, no explanation:
{"buildingType":"string","rooms":[{"name":"string","width":20,"depth":15,"height":10,"furniture":[{"name":"string","size":{"x":2,"y":1,"z":2},"color":"string","material":"string"}],"wallColor":"string","floorColor":"string","floorMaterial":"string"}],"totalWidth":50,"totalDepth":40,"exteriorColor":"string","roofColor":"string","culturalNotes":"string","confidence":75}`

    const userMsg = `Building type: ${buildingType}\n\nResearch:\n${combinedResearch.slice(0, 3000)}`
    const rawJson = await geminiGenerate(systemPrompt, userMsg, 2000)

    const cleaned = rawJson.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    result = { ...FALLBACK_RESULT(buildingType), ...parsed }
  } catch (e) {
    console.error('[researchBuildingType] Groq synthesis error:', e)
  }

  // Step 6: Save to cache
  try {
    await supabase.from('research_cache').upsert({
      building_type: buildingType,
      raw_research: combinedResearch.slice(0, 10000),
      structured_knowledge: result,
      confidence_score: result.confidence,
      research_version: 1,
      last_researched_at: new Date().toISOString(),
    }, { onConflict: 'building_type' })
  } catch (e) {
    console.error('[researchBuildingType] Cache save error:', e)
  }

  return result
}

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

// Bug fix #4: fallback has 6 rooms so minimum is always met
const FALLBACK_RESULT = (buildingType: string): ResearchResult => ({
  buildingType,
  rooms: [
    { name: 'Main Entrance', width: 16, depth: 12, height: 10, furniture: [], wallColor: 'White', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
    { name: 'Main Hall',     width: 20, depth: 15, height: 10, furniture: [], wallColor: 'White', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
    { name: 'Office',        width: 12, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'Wood' },
    { name: 'Staff Room',    width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'Wood' },
    { name: 'Storage',       width: 8,  depth: 8,  height: 8,  furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
    { name: 'Utility Room',  width: 8,  depth: 6,  height: 8,  furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
  ],
  totalWidth: 50,
  totalDepth: 40,
  exteriorColor: 'Medium stone grey',
  roofColor: 'Dark grey',
  culturalNotes: '',
  confidence: 0,
})

const GENERIC_PAD_ROOMS: ResearchResult['rooms'] = [
  { name: 'Corridor',      width: 10, depth: 6,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
  { name: 'Meeting Room',  width: 12, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'Wood' },
  { name: 'Waiting Area',  width: 12, depth: 8,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'Wood' },
  { name: 'Store Room',    width: 8,  depth: 6,  height: 8,  furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
  { name: 'Bathroom',      width: 6,  depth: 6,  height: 8,  furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'Marble' },
  { name: 'Break Room',    width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'Wood' },
]

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
  const humanName = buildingType.replace(/_/g, ' ')

  // Step 2: Wikipedia summary
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(humanName)}`,
      { headers: { 'User-Agent': 'TurboBuilder/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.extract) {
        combinedResearch += `Wikipedia: ${data.extract}\n\n`
        console.log(`[researchBuildingType] Wikipedia summary: ${data.extract.length} chars`)
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Wikipedia summary error:', e)
  }

  // Wikipedia wikitext for room/area mentions
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(humanName)}&prop=revisions&rvprop=content&format=json&rvslots=main&origin=*`
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
        const section = roomMatches.slice(0, 15).join('. ')
        combinedResearch += `Wikipedia rooms/areas: ${section}\n\n`
        console.log(`[researchBuildingType] Wikipedia wikitext rooms: ${roomMatches.length} matches`)
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
          query: `${humanName} interior layout rooms floor plan architecture`,
          search_depth: 'advanced',
          include_answer: true,
          max_results: 7,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        let tavilyText = ''
        if (data.answer) tavilyText += `Answer: ${data.answer}\n`
        tavilyText += (data.results || []).map((r: any) => r.content || '').join('\n')
        if (tavilyText) {
          combinedResearch += `Tavily:\n${tavilyText}\n\n`
          console.log(`[researchBuildingType] Tavily: ${tavilyText.length} chars`)
        }
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
          q: `${humanName} rooms list interior layout typical`,
          num: 7,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.organic || []).map((r: any) => `${r.title || ''}: ${r.snippet || ''}`).join('\n')
        if (text) {
          combinedResearch += `Serper:\n${text}\n\n`
          console.log(`[researchBuildingType] Serper: ${text.length} chars`)
        }
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
    const systemPrompt = `You are an expert architect and Roblox game developer. Given research about a building type, synthesise the information into a structured JSON layout for a Roblox building.

ROOM NAMING GUIDE (use these names when appropriate):
- Police Station: Main Entrance, Front Desk, Waiting Area, Holding Cell, Interrogation Room, Briefing Room, Locker Room, Evidence Room, Staff Room, Armory
- Hospital: Main Entrance, Reception, Waiting Room, Triage, Emergency Bay, Ward, Operating Theatre, Pharmacy, Nurse Station, Storage
- School: Main Entrance, Reception, Classroom A, Classroom B, Science Lab, Library, Cafeteria, Gymnasium, Staff Room, Principal Office
- Restaurant: Main Entrance, Dining Area, Bar, Kitchen, Storage Room, Staff Room, Bathroom
- Convenience Store: Main Entrance, Sales Floor, Checkout Area, Stockroom, Staff Room, Bathroom, Refrigeration Area
- Fire Station: Main Entrance, Apparatus Bay, Briefing Room, Dormitory, Kitchen, Locker Room, Watch Room, Gym

VALID BrickColor NAMES (use ONLY these):
White, Institutional white, Ghost white, Light grey, Medium stone grey, Dark grey, Black, Bright red, Crimson, Dark red, Rust, Bright orange, Bright yellow, Cool yellow, Bright green, Dark green, Sand green, Medium green, Mint, Bright blue, Navy blue, Sand blue, Light blue, Teal, Cyan, Bright violet, Lavender, Hot pink, Reddish brown, Brown, Pine cone, Sand yellow, Brick yellow, Fossil

VALID MATERIAL NAMES (use ONLY these):
smoothplastic, wood, concrete, brick, metal, fabric, marble, glass, neon

RULES:
- Include at least 6 rooms, at most 12 rooms. Each room name must be unique.
- Room dimensions in Roblox studs (1 stud = 28cm): width/depth 8-30, height 8-14
- Furniture: 0-5 items per room with realistic sizes
- exteriorColor and roofColor must be valid BrickColor names
- confidence: 0-100 score for how well the research supports the layout

Respond ONLY with valid JSON, no markdown, no explanation:
{"buildingType":"string","rooms":[{"name":"string","width":16,"depth":12,"height":10,"furniture":[{"name":"string","size":{"x":2,"y":1,"z":2},"color":"Reddish brown","material":"wood"}],"wallColor":"White","floorColor":"Medium stone grey","floorMaterial":"concrete"}],"totalWidth":50,"totalDepth":40,"exteriorColor":"Medium stone grey","roofColor":"Dark grey","culturalNotes":"string","confidence":75}`

    const userMsg = `Building type: ${buildingType}\n\nResearch:\n${combinedResearch.slice(0, 3000)}`
    console.log(`[researchBuildingType] Sending ${userMsg.length} chars to Groq`)
    const rawJson = await geminiGenerate(systemPrompt, userMsg, 2000)
    console.log(`[researchBuildingType] Groq raw response length: ${rawJson.length}`)

    let cleaned: string
    let parsed: any
    try {
      cleaned = rawJson.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(cleaned)
      console.log('[DEBUG] Groq returned rooms:', parsed.rooms?.map((r: any) => `${r.name}(${r.width}x${r.depth}x${r.height})`).join(', '))
    } catch (parseErr) {
      console.error('[researchBuildingType] JSON parse error:', parseErr)
      console.error('[researchBuildingType] Raw Groq response:', rawJson.slice(0, 500))
      throw parseErr
    }
    result = { ...FALLBACK_RESULT(buildingType), ...parsed }

    // Bug fix #4: enforce minimum 6 rooms after parse
    let padIdx = 0
    while (result.rooms.length < 6) {
      result.rooms.push(GENERIC_PAD_ROOMS[padIdx % GENERIC_PAD_ROOMS.length])
      padIdx++
    }
  } catch (e) {
    console.error('[researchBuildingType] Groq synthesis error:', e)
  }

  // Bug fix #2: log cache save errors explicitly
  // Step 6: Save to cache
  try {
    const { error: upsertError } = await supabase.from('research_cache').upsert({
      building_type: buildingType,
      raw_research: combinedResearch.slice(0, 10000),
      structured_knowledge: result,
      confidence_score: result.confidence,
      research_version: 1,
      last_researched_at: new Date().toISOString(),
    }, { onConflict: 'building_type' })
    if (upsertError) console.error('[researchBuildingType] Cache upsert error:', upsertError.message)
    else console.log(`[researchBuildingType] Cached "${buildingType}" confidence=${result.confidence}`)
  } catch (e) {
    console.error('[researchBuildingType] Cache save threw:', e)
  }

  return result
}

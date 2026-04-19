// lib/research-agent.ts
import { createAdminClient } from './supabase'
import { groqJSON } from './groq'

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
    quantity?: number
    placement?: 'north_wall' | 'south_wall' | 'east_wall' | 'west_wall' | 'center' | 'row'
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
  floorCount: number
  floorHeight: number
  hasGlassFront: boolean
  hasColonnade: boolean
  architecturalStyle: string
  exteriorMaterial: string
}

// ── Fallbacks ──────────────────────────────────────────────────────────────

const FALLBACK_RESULT = (buildingType: string): ResearchResult => ({
  buildingType,
  rooms: [
    { name: 'Main Entrance', width: 16, depth: 12, height: 10, furniture: [], wallColor: 'White', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    { name: 'Main Hall',     width: 20, depth: 15, height: 10, furniture: [], wallColor: 'White', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    { name: 'Office',        width: 12, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow',       floorMaterial: 'wood' },
    { name: 'Staff Room',    width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow',       floorMaterial: 'wood' },
    { name: 'Storage',       width: 8,  depth: 8,  height: 8,  furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    { name: 'Utility Room',  width: 8,  depth: 6,  height: 8,  furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
  ],
  totalWidth: 50, totalDepth: 40,
  exteriorColor: 'Medium stone grey', roofColor: 'Dark grey',
  culturalNotes: '', confidence: 0,
  floorCount: 1, floorHeight: 10,
  hasGlassFront: false, hasColonnade: false,
  architecturalStyle: 'modern', exteriorMaterial: 'smoothplastic',
})


const GENERIC_PAD_ROOMS: ResearchResult['rooms'] = [
  { name: 'Corridor',     width: 10, depth: 6,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
  { name: 'Meeting Room', width: 12, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow',       floorMaterial: 'wood' },
  { name: 'Waiting Area', width: 12, depth: 8,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow',       floorMaterial: 'wood' },
  { name: 'Store Room',   width: 8,  depth: 6,  height: 8,  furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
  { name: 'Bathroom',     width: 6,  depth: 6,  height: 8,  furniture: [], wallColor: 'White', floorColor: 'White',             floorMaterial: 'marble' },
  { name: 'Break Room',   width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow',       floorMaterial: 'wood' },
]

function getFallbackRooms(buildingType: string): ResearchResult {
  return {
    buildingType,
    floorCount: 1,
    floorHeight: 10,
    hasGlassFront: false,
    hasColonnade: false,
    architecturalStyle: 'modern',
    exteriorMaterial: 'smoothplastic',
    rooms: [
      { name: 'Main Hall',    width: 20, depth: 16, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Office',       width: 14, depth: 12, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Meeting Room', width: 12, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Reception',    width: 14, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Staff Room',   width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Toilet',       width: 6,  depth: 6,  height: 10, furniture: [], wallColor: 'White',      floorColor: 'White',             floorMaterial: 'marble' },
    ],
    totalWidth: 40,
    totalDepth: 28,
    exteriorColor: 'Light grey',
    roofColor: 'Dark grey',
    culturalNotes: buildingType,
    confidence: 20,
  }
}

// ── Main research function ─────────────────────────────────────────────────

export async function researchBuildingType(
  buildingType: string,
  options: { forceRefresh?: boolean; teachingContext?: string } = {},
): Promise<ResearchResult> {
  const { forceRefresh = false, teachingContext } = options
  const humanName = buildingType.replace(/_/g, ' ')

  const supabase = createAdminClient()

  // ── Cache check ───────────────────────────────────────────────────────────
  if (!forceRefresh) {
    try {
      const { data: cached } = await supabase
        .from('research_cache')
        .select('*')
        .eq('building_type', buildingType)
        .maybeSingle()

      if (cached?.structured_knowledge && cached.confidence_score >= 70) {
        const ageMs = Date.now() - new Date(cached.last_researched_at).getTime()
        if (ageMs < 1 * 24 * 60 * 60 * 1000) {
          console.log(`[researchBuildingType] cache hit for "${buildingType}"`)
          return cached.structured_knowledge as ResearchResult
        }
      }
    } catch { /* not cached */ }
  }

  let serperText = ''
  let pageContentText = ''
  let visionText = ''
  let wikiText = ''
  let tavilyText = ''
  let detectedFloorCount: number | undefined
  let detectedHasGlassFront: boolean | undefined
  let detectedExteriorMaterial: string | undefined

  // ── STAGE 1: Multi-query parallel Serper searches ─────────────────────────
  try {
    if (process.env.SERPER_API_KEY) {
      const queries = [
        `${humanName} interior floor plan architecture layout`,
        `${humanName} interior design furniture fixtures specifications`,
        `${humanName} room dimensions layout architecture`,
        `${humanName} real interior photographs`,
        `${humanName} architectural drawings floor plan`,
      ]
      const results = await Promise.allSettled(
        queries.map(q =>
          fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.SERPER_API_KEY! },
            body: JSON.stringify({ q, num: 5 }),
          }).then(r => r.ok ? r.json() : null)
        )
      )
      const snippets: string[] = []
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          snippets.push(...(r.value.organic || []).map((o: any) => `${o.title || ''}: ${o.snippet || ''}`))
        }
      }
      serperText = snippets.join('\n')
      console.log(`[researchBuildingType] Stage 1 Serper: ${snippets.length} results`)
    }
  } catch (e) {
    console.error('[researchBuildingType] Stage 1 error:', e)
  }

  // ── STAGE 2: Page content extraction ─────────────────────────────────────
  try {
    if (process.env.SERPER_API_KEY) {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.SERPER_API_KEY! },
        body: JSON.stringify({ q: `${humanName} interior layout design specifications rooms`, num: 8 }),
      })
      if (res.ok) {
        const data = await res.json()
        const keyUrls: string[] = (data.organic || [])
          .map((r: any) => r.link as string)
          .filter((url: string) => /architect|design|floor|plan|interior|layout|specification/i.test(url))
          .slice(0, 3)

        const pageTexts: string[] = []
        for (const url of keyUrls) {
          try {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 5000)
            const pageRes = await fetch(url, { signal: controller.signal })
            clearTimeout(timer)
            if (pageRes.ok) {
              const html = await pageRes.text()
              const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600)
              if (text.length > 100) pageTexts.push(text)
            }
          } catch { /* timeout or error, skip */ }
        }
        pageContentText = pageTexts.join('\n\n')
        console.log(`[researchBuildingType] Stage 2 page content: ${pageContentText.length} chars`)
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Stage 2 error:', e)
  }

  // ── STAGE 3: Floor plan image analysis ───────────────────────────────────
  try {
    if (process.env.SERPER_API_KEY && process.env.ANTHROPIC_API_KEY) {
      const imgRes = await fetch('https://google.serper.dev/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.SERPER_API_KEY! },
        body: JSON.stringify({ q: `${humanName} floor plan layout top view architecture`, num: 5 }),
      })
      if (imgRes.ok) {
        const imgData = await imgRes.json()
        const imgUrls: string[] = (imgData.images || [])
          .map((r: any) => r.imageUrl || r.link as string)
          .filter((u: string) => u && /\.(jpg|jpeg|png|webp)$/i.test(u))
          .slice(0, 2)

        const visionParts: string[] = []
        for (const imgUrl of imgUrls) {
          try {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 8000)
            const imgFetch = await fetch(imgUrl, { signal: controller.signal })
            clearTimeout(timer)
            if (!imgFetch.ok) continue
            const buffer = await imgFetch.arrayBuffer()
            const b64 = Buffer.from(buffer).toString('base64')

            const vRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                model: 'claude-opus-4-5',
                max_tokens: 300,
                messages: [{
                  role: 'user',
                  content: [
                    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
                    { type: 'text', text: 'This is a floor plan or interior image. List: 1) All rooms/areas visible, 2) Approximate room sizes (small/medium/large), 3) Room connections, 4) Furniture visible. Be specific. Plain text only.' },
                  ],
                }],
              }),
            })
            if (vRes.ok) {
              const vData = await vRes.json()
              const vText = vData.content?.[0]?.text
              if (vText) visionParts.push(vText)
            }
          } catch { /* skip failed image */ }
        }
        visionText = visionParts.join('\n\n')
        console.log(`[researchBuildingType] Stage 3 vision: ${visionText.length} chars`)
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Stage 3 error:', e)
  }

  // ── STAGE 4: Wikipedia deep extract ──────────────────────────────────────
  try {
    const wikiSlug = humanName.replace(/\s+/g, '_')
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`,
      { headers: { 'User-Agent': 'TurboBuilder/1.0' } }
    )
    if (summaryRes.ok) {
      const s = await summaryRes.json()
      if (s.extract) wikiText += `Summary: ${s.extract}\n\n`
    }

    const detailRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiSlug)}&prop=revisions&rvprop=content&format=json&rvslots=main&origin=*`
    )
    if (detailRes.ok) {
      const d = await detailRes.json()
      const pages = d.query?.pages || {}
      const page: any = Object.values(pages)[0]
      const raw: string = page?.revisions?.[0]?.slots?.main?.['*'] || ''
      const cleaned = raw
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
        .replace(/\{\{[^}]*\}\}/g, '')
        .replace(/==+[^=]+=+/g, '')
        .replace(/\n+/g, ' ')
        .slice(0, 800)
      if (cleaned.length > 50) wikiText += `Detail: ${cleaned}`
    }
    console.log(`[researchBuildingType] Stage 4 Wikipedia: ${wikiText.length} chars`)
  } catch (e) {
    console.error('[researchBuildingType] Stage 4 error:', e)
  }

  // ── STAGE 5: Tavily ───────────────────────────────────────────────────────
  try {
    if (process.env.TAVILY_API_KEY) {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${humanName} interior layout design specifications rooms`,
          search_depth: 'advanced',
          max_results: 5,
          include_answer: true,
          include_raw_content: false,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.answer) tavilyText += `Answer: ${data.answer}\n`
        tavilyText += (data.results || []).map((r: any) => r.content || '').join('\n')
        console.log(`[researchBuildingType] Stage 5 Tavily: ${tavilyText.length} chars`)
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Stage 5 error:', e)
  }

  // ── STAGE 6: Exterior feature research ───────────────────────────────────
  try {
    if (process.env.SERPER_API_KEY) {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.SERPER_API_KEY! },
        body: JSON.stringify({ q: `${humanName} exterior features facade material entrance`, num: 5 }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.organic || []).map((r: any) => `${r.title || ''} ${r.snippet || ''}`).join(' ').toLowerCase()
        detectedFloorCount = /two storey|two-storey|2 storey/.test(text) ? 2 : /three storey|3 storey/.test(text) ? 3 : 1
        detectedHasGlassFront = /glass front|glazed|curtain wall/.test(text)
        detectedExteriorMaterial = /brick/.test(text) ? 'brick' : /concrete|brutalist/.test(text) ? 'concrete' : /steel|cladding/.test(text) ? 'metal' : 'smoothplastic'
        console.log(`[researchBuildingType] Stage 6: floors=${detectedFloorCount} glass=${detectedHasGlassFront} mat=${detectedExteriorMaterial}`)
      }
    }
  } catch (e) {
    console.error('[researchBuildingType] Stage 6 error:', e)
  }

  // ── Groq synthesis ────────────────────────────────────────────────────────
  const combinedResearch = [serperText, pageContentText, visionText, wikiText, tavilyText]
    .filter(Boolean)
    .join('\n\n---\n\n')

  if (!combinedResearch.trim()) {
    console.log('[researchBuildingType] no research gathered, using fallback')
    return getFallbackRooms(buildingType)
  }

  const SYSTEM_PROMPT = `Expert architect. Output Roblox building spec as JSON only. No markdown fences.
floorCount 1-6. architecturalStyle: modern|colonial|victorian|chinese|japanese|art-deco|brutalist|industrial|mediterranean|gothic.
hasColonnade true if columns/arches on ground floor. hasGlassFront true if glazed facade.
exteriorMaterial: brick|concrete|smoothplastic|metal|wood. Colors: valid Roblox BrickColor names.
8-14 rooms, unique names. width/depth 8-30, height 8-14. Each room: 2-6 furniture with placement.
Placement: north_wall|south_wall|east_wall|west_wall|center|row.
Schema: {"buildingType":"","floorCount":1,"floorHeight":10,"architecturalStyle":"modern","hasGlassFront":false,"hasColonnade":false,"exteriorMaterial":"smoothplastic","rooms":[{"name":"","width":16,"depth":12,"height":10,"wallColor":"White","floorColor":"Medium stone grey","floorMaterial":"concrete","furniture":[{"name":"","size":{"x":2,"y":1,"z":2},"color":"Reddish brown","material":"wood","quantity":1,"placement":"north_wall"}]}],"totalWidth":50,"totalDepth":40,"exteriorColor":"Medium stone grey","roofColor":"Dark grey","culturalNotes":"","confidence":75}`

  const teachingNote = teachingContext ? `\nContext:\n${teachingContext.slice(0, 300)}` : ''
  const userMsg = `Building: ${buildingType}\n\nResearch:\n${combinedResearch.slice(0, 1200)}${teachingNote}`
  console.log(`[researchBuildingType] Groq input: ${userMsg.length} chars`)

  await new Promise(resolve => setTimeout(resolve, 5000))
  const parsed = await groqJSON<ResearchResult>(SYSTEM_PROMPT, userMsg, FALLBACK_RESULT(buildingType))
  console.log('[research-agent] Parsed floorCount:', parsed?.floorCount)
  console.log('[research-agent] Parsed architecturalStyle:', parsed?.architecturalStyle)
  console.log('[research-agent] Parsed exteriorColor:', parsed?.exteriorColor)
  console.log('[researchBuildingType] rooms:', parsed.rooms?.map((r: any) => r.name).join(', '))

  let result: ResearchResult = {
    ...FALLBACK_RESULT(buildingType),
    ...parsed,
    ...(detectedFloorCount !== undefined ? { floorCount: detectedFloorCount } : {}),
    ...(detectedHasGlassFront !== undefined ? { hasGlassFront: detectedHasGlassFront } : {}),
    ...(detectedExteriorMaterial !== undefined ? { exteriorMaterial: detectedExteriorMaterial } : {}),
  }

  // Ensure rooms array is valid and padded to minimum 6
  if (!Array.isArray(result.rooms) || result.rooms.length === 0) {
    result.rooms = getFallbackRooms(buildingType).rooms
  }
  let padIdx = 0
  while (result.rooms.length < 6) {
    result.rooms.push(GENERIC_PAD_ROOMS[padIdx % GENERIC_PAD_ROOMS.length])
    padIdx++
  }

  // ── Cache save ────────────────────────────────────────────────────────────
  try {
    const { error } = await supabase.from('research_cache').upsert({
      building_type: buildingType,
      raw_research: combinedResearch.slice(0, 10000),
      structured_knowledge: result,
      confidence_score: result.confidence,
      research_version: 2,
      last_researched_at: new Date().toISOString(),
    }, { onConflict: 'building_type' })
    if (error) console.error('[researchBuildingType] cache upsert error:', error.message)
    else console.log(`[researchBuildingType] cached "${buildingType}" confidence=${result.confidence}`)
  } catch (e) {
    console.error('[researchBuildingType] cache save error:', e)
  }

  return result
}

// lib/research-agent.ts
import { createAdminClient } from './supabase'
import { geminiGenerate } from './groq'
import type { QualityTarget } from './vision-analyzer'

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
  exteriorFeatures?: {
    hasFence?: boolean
    hasCarPark?: boolean
    hasFlagpole?: boolean
    hasGates?: boolean
    floorCount?: number
    hasGlassFront?: boolean
    exteriorMaterial?: string
  }
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
  const bt = buildingType.toLowerCase()
  if (bt.includes('convenience') || bt.includes('konbini') || bt.includes('store') || bt.includes('shop')) {
    return { buildingType, rooms: [
      { name: 'Main Shopping Floor', width: 24, depth: 16, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Checkout Area',       width: 12, depth: 8,  height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Refrigerator Wall',   width: 12, depth: 6,  height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Staff Room',          width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'smoothplastic' },
      { name: 'Storage Room',        width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Customer Toilet',     width: 6,  depth: 6,  height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'marble' },
    ], totalWidth: 48, totalDepth: 32, exteriorColor: 'Bright green', roofColor: 'White', culturalNotes: 'Japanese convenience store', confidence: 50 }
  }
  if (bt.includes('police') || (bt.includes('station') && !bt.includes('fire'))) {
    return { buildingType, rooms: [
      { name: 'Public Reception', width: 20, depth: 14, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Officer Bullpen',  width: 24, depth: 16, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Holding Cell 1',   width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Holding Cell 2',   width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Interview Room',   width: 10, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Chief Office',     width: 12, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Reddish brown', floorMaterial: 'wood' },
    ], totalWidth: 50, totalDepth: 36, exteriorColor: 'Navy blue', roofColor: 'Dark grey', culturalNotes: 'UK police station', confidence: 50 }
  }
  if (bt.includes('fire')) {
    return { buildingType, rooms: [
      { name: 'Apparatus Bay', width: 24, depth: 16, height: 12, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Watch Room',    width: 12, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Briefing Room', width: 14, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
      { name: 'Dormitory',     width: 14, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'wood' },
      { name: 'Kitchen',       width: 12, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Locker Room',   width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    ], totalWidth: 50, totalDepth: 36, exteriorColor: 'Bright red', roofColor: 'Dark grey', culturalNotes: 'UK fire station', confidence: 50 }
  }
  if (bt.includes('hospital') || bt.includes('clinic')) {
    return { buildingType, rooms: [
      { name: 'Main Entrance',  width: 20, depth: 14, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Reception',      width: 16, depth: 12, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Waiting Room',   width: 16, depth: 12, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Emergency Bay',  width: 20, depth: 14, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Ward',           width: 20, depth: 14, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
      { name: 'Nurse Station',  width: 12, depth: 10, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic' },
    ], totalWidth: 52, totalDepth: 40, exteriorColor: 'White', roofColor: 'White', culturalNotes: 'NHS hospital', confidence: 50 }
  }
  return {
    buildingType, rooms: [
      { name: 'Main Hall',    width: 20, depth: 16, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'smoothplastic' },
      { name: 'Office',       width: 14, depth: 12, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'smoothplastic' },
      { name: 'Meeting Room', width: 12, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'smoothplastic' },
      { name: 'Reception',    width: 14, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'smoothplastic' },
      { name: 'Staff Room',   width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'smoothplastic' },
      { name: 'Toilet',       width: 6,  depth: 6,  height: 10, furniture: [], wallColor: 'White',      floorColor: 'White',             floorMaterial: 'marble' },
    ],
    totalWidth: 44, totalDepth: 32, exteriorColor: 'Light grey', roofColor: 'Dark grey', culturalNotes: 'Generic building', confidence: 30,
  }
}

// ── Main research function ─────────────────────────────────────────────────

export async function researchBuildingType(
  buildingType: string,
  forceRefresh = false,
  qualityTarget?: QualityTarget,
  teachingContext?: string,
): Promise<ResearchResult> {
  const humanName = buildingType.replace(/_/g, ' ')

  // ── Fast path: static specs ───────────────────────────────────────────────
  if (!forceRefresh) {
    try {
      const { STATIC_BUILDING_SPECS } = await import('./static-specs')
      const staticKey = Object.keys(STATIC_BUILDING_SPECS).find(k =>
        buildingType.toLowerCase().replace(/\s+/g, '_').includes(k) ||
        k.split('_').every(word => buildingType.toLowerCase().includes(word))
      )
      if (staticKey) {
        console.log(`[researchBuildingType] static spec hit: "${staticKey}"`)
        return STATIC_BUILDING_SPECS[staticKey]
      }
    } catch (e) {
      console.error('[researchBuildingType] static-specs import error:', e)
    }
  }

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
        if (ageMs < 30 * 24 * 60 * 60 * 1000) {
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
  let exteriorFeatures: ResearchResult['exteriorFeatures'] = {}

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
        exteriorFeatures = {
          hasFence: /fence|railing|perimeter wall/.test(text),
          hasCarPark: /car park|parking|vehicle/.test(text),
          hasFlagpole: /flag/.test(text),
          hasGates: /gate|barrier|security entrance/.test(text),
          floorCount: /two storey|two-storey|2 storey/.test(text) ? 2 : /three storey|3 storey/.test(text) ? 3 : /single storey/.test(text) ? 1 : 1,
          hasGlassFront: /glass front|glazed|curtain wall/.test(text),
          exteriorMaterial: /brick/.test(text) ? 'brick' : /concrete|brutalist/.test(text) ? 'concrete' : /steel|cladding/.test(text) ? 'metal' : 'smoothplastic',
        }
        console.log(`[researchBuildingType] Stage 6 exterior features:`, exteriorFeatures)
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

  let result: ResearchResult = FALLBACK_RESULT(buildingType)

  try {
    const systemPrompt = `You are an expert architect and Roblox game developer. Based on real research about ${humanName}, generate a REALISTIC Roblox building specification. Use ACTUAL room names and furniture from this building type. Do NOT use generic placeholders.

Scale: 1 stud = 28cm. Typical room: 10-20 studs wide, 8-16 studs deep, 8-12 studs tall.

ROOM NAMING GUIDE:
- Police Station: Main Entrance, Front Desk, Waiting Area, Holding Cell, Interrogation Room, Briefing Room, Locker Room, Evidence Room, Staff Room, Armory
- Hospital: Main Entrance, Reception, Waiting Room, Triage, Emergency Bay, Ward, Operating Theatre, Pharmacy, Nurse Station, Storage
- School: Main Entrance, Reception, Classroom A, Classroom B, Science Lab, Library, Cafeteria, Gymnasium, Staff Room, Principal Office
- Restaurant: Main Entrance, Dining Area, Bar, Kitchen, Storage Room, Staff Room, Bathroom
- Fire Station: Main Entrance, Apparatus Bay, Briefing Room, Dormitory, Kitchen, Locker Room, Watch Room, Gym

VALID BrickColors: White, Institutional white, Ghost white, Light grey, Medium stone grey, Dark grey, Really black, Bright red, Crimson, Dark red, Rust, Bright orange, Bright yellow, Cool yellow, Bright green, Dark green, Sand green, Bright blue, Navy blue, Sand blue, Light blue, Teal, Cyan, Bright violet, Hot pink, Reddish brown, Brown, Sand yellow, Brick yellow, Fossil

VALID materials: smoothplastic, wood, concrete, brick, metal, fabric, marble, neon

RULES:
- Minimum 8 rooms, maximum 14. Each room name unique.
- Room dimensions: width/depth 8-30, height 8-14
- Each room: 3-10 furniture items with quantity and placement fields
- Valid placement: north_wall, south_wall, east_wall, west_wall, center, row
- exteriorColor and roofColor must be valid BrickColors
- confidence: 0-100

Respond ONLY with valid JSON, no markdown:
{"buildingType":"string","rooms":[{"name":"string","width":16,"depth":12,"height":10,"furniture":[{"name":"string","size":{"x":2,"y":1,"z":2},"color":"Reddish brown","material":"wood","quantity":1,"placement":"north_wall"}],"wallColor":"White","floorColor":"Medium stone grey","floorMaterial":"concrete"}],"totalWidth":50,"totalDepth":40,"exteriorColor":"Medium stone grey","roofColor":"Dark grey","culturalNotes":"string","confidence":75}`

    const truncated = combinedResearch.substring(0, 2000)
    const qualityNote = qualityTarget
      ? `\n\nQuality target: ${qualityTarget.detailLevel}/10 detail level, ${qualityTarget.interiorStyle} style. Add more furniture if detail >= 7.`
      : ''
    const teachingNote = teachingContext ? `\n\nPrevious generation context:\n${teachingContext}` : ''
    const userMsg = `Building type: ${buildingType}\n\nResearch:\n${truncated}${qualityNote}${teachingNote}`

    console.log(`[researchBuildingType] Groq input: ${userMsg.length} chars`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    const rawJson = await geminiGenerate(systemPrompt, userMsg, 2000)
    console.log(`[researchBuildingType] Groq response: ${rawJson.length} chars`)

    const cleaned = rawJson.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    console.log('[researchBuildingType] rooms:', parsed.rooms?.map((r: any) => r.name).join(', '))
    result = { ...FALLBACK_RESULT(buildingType), ...parsed, exteriorFeatures }

    // Pad to minimum 6 rooms
    let padIdx = 0
    while (result.rooms.length < 6) {
      result.rooms.push(GENERIC_PAD_ROOMS[padIdx % GENERIC_PAD_ROOMS.length])
      padIdx++
    }
  } catch (e) {
    console.error('[researchBuildingType] Groq synthesis error:', e)
    result = { ...getFallbackRooms(buildingType), exteriorFeatures }
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

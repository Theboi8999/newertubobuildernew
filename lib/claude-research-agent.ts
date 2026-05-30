import Anthropic from '@anthropic-ai/sdk'
import { ResearchResult } from './research-agent'
import fs from 'fs'
import path from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Load roblox reference rules once at startup
let _refRules = ''
try {
  const ref = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'roblox-reference.json'), 'utf-8'))
  _refRules = (ref.rules as string[]).map((r, i) => `${i + 1}. ${r}`).join('\n')
} catch {}

function loadBuildingSpec(buildingType: string): any {
  try {
    const key = buildingType.replace(/_/g, '-')
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'building-specs', `${key}.json`), 'utf-8'))
  } catch {
    return null
  }
}

const RESEARCH_SYSTEM_PROMPT = `You are an expert architectural
researcher for a Roblox building generator called TurboBuilder.
Your job is to analyse a building type and return a precise JSON
specification that will be used to generate a 3D building in Roblox.

You have deep knowledge of:
- Global architectural styles and their visual characteristics
- Roblox BrickColor names and which ones look realistic
- What materials and proportions make buildings look authentic
- Cultural and regional building traditions

ROBLOX BRICKCOLOR NAMES YOU MUST USE (exact strings):
Walls: 'Reddish brown', 'Sand yellow', 'Light grey', 'White',
'Medium stone grey', 'Bright red', 'Dark grey', 'Cashmere',
'Light stone grey', 'Institutional white', 'Brick yellow'

Roofs: 'Dark grey', 'Really black', 'Reddish brown', 'Dark green',
'Medium stone grey', 'Dark stone grey'

Accents: 'White', 'Dark green', 'Really black', 'Bright blue',
'Reddish brown', 'Sand yellow', 'Dark grey'

ROBLOX MATERIALS (exact strings):
'brick', 'smoothplastic', 'concrete', 'wood', 'metal', 'marble',
'glass', 'neon', 'fabric'

You must return ONLY valid JSON matching the schema exactly.
No markdown, no explanation, just JSON.`

export async function claudeResearchBuilding(
  prompt: string,
  buildingType: string,
  referenceImageUrl?: string
): Promise<ResearchResult> {

  const userPrompt = `Research this building for Roblox generation:
Prompt: "${prompt}"
Building type: "${buildingType}"

Return a JSON object with EXACTLY these fields:
{
  "buildingType": "${buildingType}",
  "architecturalStyle": "detailed style description",
  "description": "what this building looks like",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "floorCount": 2,
  "floorHeight": 12,
  "totalWidth": 40,
  "totalDepth": 28,
  "exteriorColor": "exact Roblox BrickColor name",
  "roofColor": "exact Roblox BrickColor name",
  "accentColor": "exact Roblox BrickColor name",
  "exteriorMaterial": "brick OR smoothplastic OR concrete",
  "roofMaterial": "smoothplastic OR concrete",
  "wallMaterial": "brick OR smoothplastic OR concrete",
  "windowStyle": "rectangular OR arched OR louvred",
  "colonnadeStyle": "none OR classical OR modern",
  "shutterColor": "exact Roblox BrickColor name OR none",
  "floorBandColor": "exact Roblox BrickColor name",
  "columnColor": "exact Roblox BrickColor name",
  "hasColonnade": false,
  "hasGlassFront": false,
  "hasPagodaRoof": false,
  "hasBalcony": false,
  "roofType": "flat OR shed OR gable OR hip OR parapet OR pagoda",
  "confidence": 95,
  "culturalNotes": "brief cultural context",
  "rooms": [
    {
      "name": "Room Name",
      "width": 15,
      "depth": 12,
      "height": 10,
      "floor": 0,
      "wallColor": "Roblox BrickColor name",
      "floorColor": "Roblox BrickColor name",
      "floorMaterial": "concrete OR wood OR marble",
      "furniture": []
    }
  ]
}

IMPORTANT RULES:
1. exteriorMaterial MUST be 'brick' for brick buildings,
   'smoothplastic' for rendered/plaster buildings
2. floorCount must match what the user asked for
3. Colors must be exact Roblox BrickColor names from the list above
4. rooms must have at least 4 rooms distributed across floors
5. Think carefully about what this building ACTUALLY looks like
6. Australian houses: exteriorMaterial='brick', hasBalcony=true for 2+ floors
7. Peranakan shophouses: exteriorMaterial='smoothplastic',
   exteriorColor='Sand yellow', hasColonnade=true, roofType='parapet'
8. Modern hospitals: exteriorColor='White', exteriorMaterial='smoothplastic'
9. Victorian buildings: exteriorMaterial='brick',
   exteriorColor='Reddish brown'`

  // Inject reference rules and building spec if available
  const spec = loadBuildingSpec(buildingType)
  const specHint = spec ? `
REFERENCE SPEC for ${spec.name}:
- Walls: color="${spec.elements?.walls?.color}", material="${spec.elements?.walls?.material}"
- Roof: color="${spec.elements?.roof?.color}", material="${spec.elements?.roof?.material}", style="${spec.elements?.roof?.style}"
- Trim: color="${spec.elements?.trim?.color}", material="${spec.elements?.trim?.material}"
- Windows: glass_color="${spec.elements?.windows?.glass_color}", transparency=${spec.elements?.windows?.glass_transparency}, frame_color="${spec.elements?.windows?.frame_color}"
- Dimensions: width=${spec.dimensions?.width}, depth=${spec.dimensions?.depth}, floors=${spec.dimensions?.floors}
Use these exact values in your response.` : ''

  const rulesHint = _refRules ? `\nMATERIAL RULES (CRITICAL):\n${_refRules}` : ''

  const fullUserPrompt = userPrompt + specHint + rulesHint

  // Build message content
  const messageContent: Anthropic.MessageParam['content'] = []

  // Add reference image if provided
  if (referenceImageUrl) {
    try {
      const imageResponse = await fetch(referenceImageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64 = Buffer.from(imageBuffer).toString('base64')
      const contentType = (imageResponse.headers.get('content-type') || 'image/jpeg') as
        'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: contentType,
          data: base64
        }
      })
      messageContent.push({
        type: 'text',
        text: fullUserPrompt + '\n\nAnalyse the reference image above and use it to inform your color, material, and style choices.'
      })
    } catch (e) {
      console.error('[claude-research] failed to load reference image:', e)
      messageContent.push({ type: 'text', text: fullUserPrompt })
    }
  } else {
    messageContent.push({ type: 'text', text: fullUserPrompt })
  }

  console.log('[claude-research] calling Claude for:', buildingType)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: RESEARCH_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: messageContent }
    ]
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('')

  // Parse JSON — strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('[claude-research] no JSON object in response')
  const parsed = JSON.parse(clean.substring(start, end + 1))

  // Ensure rooms have all required fields
  if (parsed.rooms) {
    parsed.rooms = parsed.rooms.map((r: any) => ({
      furniture: [],
      wallColor: 'Light grey',
      floorColor: 'Medium stone grey',
      floorMaterial: 'concrete',
      floor: 0,
      ...r
    }))
  }

  console.log('[claude-research] result:', {
    buildingType: parsed.buildingType,
    exteriorColor: parsed.exteriorColor,
    exteriorMaterial: parsed.exteriorMaterial,
    floorCount: parsed.floorCount,
    roofType: parsed.roofType,
    confidence: parsed.confidence
  })

  return parsed as ResearchResult
}

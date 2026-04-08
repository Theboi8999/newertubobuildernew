import { buildRbxmx, type RbxModel } from './rbxmx'
import { filterPrompt } from './prompt-filter'
import { validateRbxmx, watermarkRbxmx } from './output-validator'
import { savePromptHistory } from './prompt-memory'
import { geminiGenerate } from './groq'
import { ROOM_TEMPLATES, BUILDING_BLUEPRINTS, detectBuildingType, offsetRoom } from './room-templates'
import type { StyleType, ScaleType } from './styles'

export interface GenerationOptions {
  style?: StyleType
  scale?: ScaleType
  locationReference?: { address: string; lat: number; lng: number }
  enhancePrompt?: boolean
  variations?: number
}

export interface GenerationResult {
  rbxmx: string
  spec: SpecItem[]
  qualityScore: number
  qualityNotes: string
  quantity: number
  enhancedPrompt?: string
  newScriptsGenerated?: string[]
  validationWarnings?: string[]
}

export interface SpecItem {
  label: string
  category: string
  count: number
}

// Build exterior shell around a blueprint
function buildExterior(totalW: number, totalD: number, wallH: number, exteriorColor: string, roofColor: string) {
  const parts: any[] = []
  const wallT = 1.5

  // Foundation/ground floor
  parts.push({ name: 'Foundation', size: { x: totalW + 4, y: 1, z: totalD + 4 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })

  // Exterior walls
  parts.push({ name: 'WallNorth', size: { x: totalW, y: wallH, z: wallT }, position: { x: 0, y: wallH / 2 + 1, z: -(totalD / 2) }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'WallSouth', size: { x: totalW, y: wallH, z: wallT }, position: { x: 0, y: wallH / 2 + 1, z: totalD / 2 }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'WallEast', size: { x: wallT, y: wallH, z: totalD }, position: { x: totalW / 2, y: wallH / 2 + 1, z: 0 }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'WallWest', size: { x: wallT, y: wallH, z: totalD }, position: { x: -(totalW / 2), y: wallH / 2 + 1, z: 0 }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })

  // Roof
  parts.push({ name: 'Roof', size: { x: totalW + 2, y: 1.5, z: totalD + 2 }, position: { x: 0, y: wallH + 1.75, z: 0 }, color: roofColor, material: 'metal', anchored: true, transparency: 0, shape: 'Block' })

  // Roof edge trim
  parts.push({ name: 'RoofTrimN', size: { x: totalW + 4, y: 0.8, z: 0.5 }, position: { x: 0, y: wallH + 2.5, z: -(totalD / 2 + 1) }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'RoofTrimS', size: { x: totalW + 4, y: 0.8, z: 0.5 }, position: { x: 0, y: wallH + 2.5, z: totalD / 2 + 1 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' })

  // Front entrance steps
  parts.push({ name: 'Step1', size: { x: 8, y: 0.5, z: 2 }, position: { x: 0, y: 0.25, z: -(totalD / 2 + 1) }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'Step2', size: { x: 8, y: 1, z: 2 }, position: { x: 0, y: 0.5, z: -(totalD / 2 + 3) }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })

  // Entrance sign panel
  parts.push({ name: 'SignPanel', size: { x: 10, y: 2, z: 0.5 }, position: { x: 0, y: wallH - 1, z: -(totalD / 2 + 0.3) }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })

  // Corner pillars
  const cx = totalW / 2
  const cz = totalD / 2
  for (const [px, pz] of [[-cx, -cz], [cx, -cz], [-cx, cz], [cx, cz]]) {
    parts.push({ name: `Pillar_${px}_${pz}`, size: { x: 1.5, y: wallH + 1, z: 1.5 }, position: { x: px, y: (wallH + 1) / 2 + 1, z: pz }, color: 'Light grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })
  }

  // Exterior lights
  parts.push({ name: 'ExtLight1', size: { x: 0.5, y: 0.5, z: 0.5 }, position: { x: -6, y: wallH, z: -(totalD / 2 + 0.5) }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'ExtLight2', size: { x: 0.5, y: 0.5, z: 0.5 }, position: { x: 6, y: wallH, z: -(totalD / 2 + 0.5) }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0, shape: 'Block' })

  return parts
}

// Generate interior dividing walls between rooms
function buildInteriorWalls(totalW: number, totalD: number, wallH: number) {
  const parts: any[] = []
  const wallT = 0.8

  // Horizontal divider
  parts.push({ name: 'InteriorWallH1', size: { x: totalW - 2, y: wallH, z: wallT }, position: { x: 0, y: wallH / 2 + 1, z: 0 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })

  // Vertical dividers
  parts.push({ name: 'InteriorWallV1', size: { x: wallT, y: wallH, z: totalD / 2 - 2 }, position: { x: -totalW / 4, y: wallH / 2 + 1, z: totalD / 4 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'InteriorWallV2', size: { x: wallT, y: wallH, z: totalD / 2 - 2 }, position: { x: totalW / 4, y: wallH / 2 + 1, z: totalD / 4 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })

  return parts
}

export async function generateAsset(
  prompt: string,
  systemType: 'builder' | 'modeling' | 'project',
  options: GenerationOptions = {},
  userId?: string,
  generationId?: string,
  onProgress?: (msg: string, percent: number) => void
): Promise<GenerationResult> {

  const filter = filterPrompt(prompt)
  if (!filter.allowed) throw new Error(filter.reason)

  onProgress?.('🔍 Planning your build...', 10)

  let allParts: any[] = []
  let spec: SpecItem[] = []
  let usedBlueprint = false

  // Check if we have a blueprint for this building type
  if (systemType === 'builder') {
    const buildingType = detectBuildingType(prompt)

    if (buildingType && BUILDING_BLUEPRINTS[buildingType]) {
      usedBlueprint = true
      onProgress?.('📐 Loading building blueprint...', 20)

      const blueprint = BUILDING_BLUEPRINTS[buildingType]

      // Build exterior shell
      const exteriorParts = buildExterior(blueprint.totalWidth, blueprint.totalDepth, 12, blueprint.exteriorColor, blueprint.roofColor)
      allParts.push(...exteriorParts)

      // Add interior walls
      const interiorWalls = buildInteriorWalls(blueprint.totalWidth, blueprint.totalDepth, 12)
      allParts.push(...interiorWalls)

      // Add each room's furniture
      for (const room of blueprint.rooms) {
        const template = ROOM_TEMPLATES[room.template]
        if (template) {
          const roomParts = offsetRoom(template, room.offsetX, 1, room.offsetZ)
          allParts.push(...roomParts)
          spec.push({ label: room.label, category: 'structure', count: 1 })
        }
      }

      onProgress?.('⚡ Enhancing with AI details...', 50)

      // Use AI to generate additional unique details for this specific building
      const detailPrompt = `You are a Roblox builder. Generate 15-20 additional detail parts for a ${prompt}.
These should be UNIQUE decorative and functional parts that make the building feel authentic and lived-in.
Think: signs, equipment specific to this building type, decorations, vehicles outside, etc.

Return ONLY a JSON array of parts (no wrapper object):
[
  {"name":"PartName","size":{"x":1,"y":1,"z":1},"position":{"x":0,"y":1,"z":0},"color":"BrickColor","material":"brick|metal|wood|glass|plastic|concrete|fabric|neon|SmoothPlastic","anchored":true,"transparency":0,"shape":"Block|Sphere|Cylinder|Wedge"}
]

Position parts within a ${blueprint.totalWidth}x${blueprint.totalDepth} stud footprint centered at origin. Y=0 is ground.`

      try {
        const detailText = await geminiGenerate(
          `You are an expert Roblox builder with 5 years experience. You add realistic details to buildings. Output ONLY valid JSON arrays.`,
          detailPrompt,
          3000
        )
        const cleanDetail = detailText.replace(/```json|```/g, '').trim()
        const extraParts = JSON.parse(cleanDetail)
        if (Array.isArray(extraParts)) {
          allParts.push(...extraParts.map((p: any) => ({ ...p, anchored: true })))
          spec.push({ label: 'AI-generated details', category: 'furniture', count: extraParts.length })
        }
      } catch {
        // Detail generation failed — continue without it
      }

    }
  }

  // If no blueprint or non-builder type — use full AI generation
  if (!usedBlueprint) {
    onProgress?.('⚡ Generating with AI...', 30)

    const systemPrompt = systemType === 'builder'
      ? `You are a senior Roblox developer with 5 years experience. You build detailed, realistic environments for RP servers.
You think creatively about what makes buildings feel REAL and fun. You use proper Roblox coordinates (Y=height/2 for ground parts).
You generate 40-60 detailed parts. Minimum wall height 10 studs. All rooms have furniture.
Output ONLY valid JSON. No markdown. No explanation.`
      : systemType === 'modeling'
      ? `You are a senior Roblox vehicle developer. You build detailed vehicles with proper proportions and working scripts.
Output ONLY valid JSON. No markdown. No explanation.`
      : `You are a senior Roblox world builder. You build detailed maps with roads, buildings, and terrain.
Output ONLY valid JSON. No markdown. No explanation.`

    const styleNote = options.style ? ` Style: ${options.style}.` : ''
    const scaleNote = options.scale ? ` Scale: ${options.scale}.` : ''

    const userPrompt = `Build this Roblox ${systemType === 'builder' ? 'building' : systemType === 'modeling' ? 'vehicle/tool' : 'map'}: "${prompt}"${styleNote}${scaleNote}

Think about what makes this feel REAL. What rooms, furniture, and details bring it to life?
Use correct coordinates: Y position = half the part height for ground-level parts.
Minimum 40 parts. Make it impressive.

Return this exact JSON:
{
  "models": [{
    "name": "BuildingName",
    "parts": [
      {"name":"Floor","size":{"x":50,"y":1,"z":40},"position":{"x":0,"y":0.5,"z":0},"color":"Medium stone grey","material":"concrete","anchored":true,"transparency":0,"shape":"Block"}
    ],
    "scripts": [],
    "children": []
  }],
  "spec": [{"label":"Main Structure","category":"structure","count":1}]
}`

    const genText = await geminiGenerate(systemPrompt, userPrompt, 7000)

    try {
      const clean = genText.replace(/```json|```/g, '').trim()
      const genData: { models: RbxModel[]; spec: SpecItem[] } = JSON.parse(clean)

      if (!genData.models?.[0]?.parts || genData.models[0].parts.length < 3) {
        throw new Error('Not enough parts generated')
      }

      onProgress?.('📦 Compiling .rbxmx...', 90)

      let rbxmx = buildRbxmx(genData.models)
      const validation = validateRbxmx(rbxmx)
      if (validation.fixed) rbxmx = validation.fixed
      if (userId && generationId) rbxmx = watermarkRbxmx(rbxmx, generationId, userId)

      if (userId) {
        await savePromptHistory(userId, { prompt, system_type: systemType, quality_score: 85, style: options.style, scale: options.scale }).catch(() => {})
      }

      onProgress?.('✅ Complete!', 100)

      return {
        rbxmx,
        spec: genData.spec || [],
        qualityScore: 85,
        qualityNotes: 'AI generated.',
        quantity: 1,
        validationWarnings: [...validation.warnings, ...validation.tosIssues],
      }
    } catch {
      throw new Error('Generation failed — please try again')
    }
  }

  // Blueprint path — build rbxmx from allParts
  onProgress?.('📦 Compiling .rbxmx...', 85)

  const model: RbxModel = {
    name: prompt.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    parts: allParts,
    scripts: [],
    children: [],
  }

  let rbxmx = buildRbxmx([model])
  const validation = validateRbxmx(rbxmx)
  if (validation.fixed) rbxmx = validation.fixed
  if (userId && generationId) rbxmx = watermarkRbxmx(rbxmx, generationId, userId)

  if (userId) {
    await savePromptHistory(userId, { prompt, system_type: systemType, quality_score: 92, style: options.style, scale: options.scale }).catch(() => {})
  }

  onProgress?.('✅ Complete!', 100)

  return {
    rbxmx,
    spec,
    qualityScore: 92,
    qualityNotes: 'Built with blueprint + AI details.',
    quantity: 1,
    validationWarnings: [...validation.warnings, ...validation.tosIssues],
  }
}

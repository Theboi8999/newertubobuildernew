import { buildRbxmx, type RbxModel } from './rbxmx'
import { filterPrompt } from './prompt-filter'
import { validateRbxmx, watermarkRbxmx } from './output-validator'
import { savePromptHistory } from './prompt-memory'
import { geminiGenerate } from './groq'
import { researchTopic } from './research'
import { ROOM_TEMPLATES, BUILDING_BLUEPRINTS, detectBuildingType, offsetRoom } from './room-templates'

export interface GenerationOptions {
  style?: string
  scale?: string
  locationReference?: { address: string }
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

// Sanitize parts — force Block shape, fix coordinates
function sanitizeParts(parts: any[]): any[] {
  return (parts || []).filter(p => p && p.name).map(p => ({
    name: String(p.name || 'Part'),
    size: {
      x: Math.max(0.1, Number(p.size?.x) || 1),
      y: Math.max(0.1, Number(p.size?.y) || 1),
      z: Math.max(0.1, Number(p.size?.z) || 1),
    },
    position: {
      x: Number(p.position?.x) || 0,
      y: Math.max(0.05, Number(p.position?.y) || 0.5),
      z: Number(p.position?.z) || 0,
    },
    color: String(p.color || 'Medium stone grey'),
    material: String(p.material || 'SmoothPlastic'),
    anchored: true,
    transparency: Math.max(0, Math.min(1, Number(p.transparency) || 0)),
    shape: 'Block', // ALWAYS Block — never trust AI
  }))
}

function buildExterior(totalW: number, totalD: number, wallH: number, exteriorColor: string, roofColor: string): any[] {
  const parts: any[] = []
  parts.push({ name: 'Foundation', size: { x: totalW + 4, y: 1, z: totalD + 4 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'WallNorth', size: { x: totalW, y: wallH, z: 1.5 }, position: { x: 0, y: wallH / 2 + 1, z: -(totalD / 2) }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'WallSouth', size: { x: totalW, y: wallH, z: 1.5 }, position: { x: 0, y: wallH / 2 + 1, z: totalD / 2 }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'WallEast', size: { x: 1.5, y: wallH, z: totalD }, position: { x: totalW / 2, y: wallH / 2 + 1, z: 0 }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'WallWest', size: { x: 1.5, y: wallH, z: totalD }, position: { x: -(totalW / 2), y: wallH / 2 + 1, z: 0 }, color: exteriorColor, material: 'brick', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'Roof', size: { x: totalW + 2, y: 1.5, z: totalD + 2 }, position: { x: 0, y: wallH + 1.75, z: 0 }, color: roofColor, material: 'metal', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'StepBottom', size: { x: 10, y: 0.5, z: 2 }, position: { x: 0, y: 0.25, z: -(totalD / 2 + 1) }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'StepTop', size: { x: 10, y: 1, z: 2 }, position: { x: 0, y: 0.5, z: -(totalD / 2 + 3) }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'SignPanel', size: { x: 12, y: 2.5, z: 0.5 }, position: { x: 0, y: wallH - 1, z: -(totalD / 2 + 0.5) }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'ExtLight1', size: { x: 0.5, y: 0.5, z: 0.5 }, position: { x: -6, y: wallH, z: -(totalD / 2 + 0.3) }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0, shape: 'Block' })
  parts.push({ name: 'ExtLight2', size: { x: 0.5, y: 0.5, z: 0.5 }, position: { x: 6, y: wallH, z: -(totalD / 2 + 0.3) }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0, shape: 'Block' })
  for (const [px, pz] of [[-totalW/2, -totalD/2], [totalW/2, -totalD/2], [-totalW/2, totalD/2], [totalW/2, totalD/2]]) {
    parts.push({ name: 'Pillar', size: { x: 2, y: wallH + 1, z: 2 }, position: { x: px, y: (wallH + 1) / 2 + 1, z: pz }, color: 'Light grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' })
  }
  return parts
}

// Generic building builder for unknown building types
function buildGenericBuilding(prompt: string, rooms: string[]): any[] {
  const parts: any[] = []
  const totalW = 40
  const totalD = 30
  const wallH = 12

  // Exterior
  parts.push(...buildExterior(totalW, totalD, wallH, 'Light grey', 'Dark grey'))

  // Interior floor
  parts.push({ name: 'InteriorFloor', size: { x: totalW - 3, y: 0.5, z: totalD - 3 }, position: { x: 0, y: 1.25, z: 0 }, color: 'Sand yellow', material: 'wood', anchored: true, transparency: 0, shape: 'Block' })

  // Ceiling lights
  for (let lx = -12; lx <= 12; lx += 12) {
    parts.push({ name: `CeilingLight`, size: { x: 3, y: 0.3, z: 1 }, position: { x: lx, y: wallH + 0.8, z: 0 }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0.2, shape: 'Block' })
  }

  // Add room furniture based on detected rooms
  let zOffset = -10
  for (const room of rooms.slice(0, 4)) {
    const r = room.toLowerCase()

    if (r.includes('office') || r.includes('reception')) {
      // Desk
      parts.push({ name: `${room}_Desk`, size: { x: 5, y: 2, z: 2 }, position: { x: -8, y: 2, z: zOffset }, color: 'Reddish brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Chair`, size: { x: 2, y: 2, z: 2 }, position: { x: -8, y: 2, z: zOffset + 2 }, color: 'Black', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Monitor`, size: { x: 2, y: 1.5, z: 0.2 }, position: { x: -8, y: 4, z: zOffset - 1 }, color: 'Dark grey', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })
    } else if (r.includes('kitchen') || r.includes('break') || r.includes('mess')) {
      parts.push({ name: `${room}_Table`, size: { x: 6, y: 1, z: 3 }, position: { x: 5, y: 3, z: zOffset }, color: 'Reddish brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Chair1`, size: { x: 2, y: 2, z: 2 }, position: { x: 2, y: 2, z: zOffset + 2.5 }, color: 'Black', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Counter`, size: { x: 8, y: 3, z: 2 }, position: { x: -5, y: 2, z: zOffset - 3 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Fridge`, size: { x: 2, y: 5, z: 2 }, position: { x: 10, y: 3.5, z: zOffset - 3 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' })
    } else if (r.includes('bed') || r.includes('dorm') || r.includes('bunk')) {
      parts.push({ name: `${room}_Bed1`, size: { x: 5, y: 1, z: 3 }, position: { x: -8, y: 2, z: zOffset }, color: 'White', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Bed2`, size: { x: 5, y: 1, z: 3 }, position: { x: -2, y: 2, z: zOffset }, color: 'White', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Locker1`, size: { x: 2, y: 5, z: 2 }, position: { x: 5, y: 3.5, z: zOffset }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' })
      parts.push({ name: `${room}_Locker2`, size: { x: 2, y: 5, z: 2 }, position: { x: 7.5, y: 3.5, z: zOffset }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' })
    }

    zOffset += 8
  }

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

  onProgress?.('🔍 Researching building...', 10)
  const research = await researchTopic(prompt, systemType)

  let allParts: any[] = []
  let spec: SpecItem[] = []

  if (systemType === 'builder') {
    const buildingType = detectBuildingType(prompt)

    if (buildingType && BUILDING_BLUEPRINTS[buildingType]) {
      // KNOWN BUILDING — use full blueprint
      onProgress?.('📐 Building from blueprint...', 25)
      const blueprint = BUILDING_BLUEPRINTS[buildingType]
      allParts.push(...buildExterior(blueprint.totalWidth, blueprint.totalDepth, 12, blueprint.exteriorColor, blueprint.roofColor))

      for (const room of blueprint.rooms) {
        const template = ROOM_TEMPLATES[room.template]
        if (template) {
          allParts.push(...offsetRoom(template, room.offsetX, 1, room.offsetZ))
          spec.push({ label: room.label, category: 'structure', count: 1 })
        }
      }

      // Ask AI only for room NAMES to add — not coordinates
      onProgress?.('⚡ Adding custom details...', 60)
      try {
        const roomsText = await geminiGenerate(
          'You list rooms for buildings. Output ONLY a JSON array of room name strings. No explanation.',
          `List 4 additional rooms/areas in a ${prompt} not in this list: ${blueprint.rooms.map(r => r.label).join(', ')}. Output: ["Room1","Room2","Room3","Room4"]`,
          200
        )
        const extraRooms = JSON.parse(roomsText.replace(/```json|```/g, '').trim())
        const genericParts = buildGenericBuilding(prompt, Array.isArray(extraRooms) ? extraRooms : [])
        allParts.push(...genericParts.slice(10)) // Skip exterior parts, add furniture only
      } catch { /* skip */ }

    } else {
      // UNKNOWN BUILDING — use generic builder with AI room detection
      onProgress?.('🤔 Detecting building type...', 20)

      let roomList: string[] = ['Reception', 'Main Hall', 'Office', 'Storage']
      try {
        const roomsText = await geminiGenerate(
          'You list rooms for buildings. Output ONLY a JSON array of room name strings.',
          `List the 6 most important rooms in a "${prompt}". Output: ["Room1","Room2","Room3","Room4","Room5","Room6"]`,
          300
        )
        const parsed = JSON.parse(roomsText.replace(/```json|```/g, '').trim())
        if (Array.isArray(parsed)) roomList = parsed
      } catch { /* use defaults */ }

      onProgress?.('📐 Building structure...', 40)
      allParts = buildGenericBuilding(prompt, roomList)
      spec = roomList.map(r => ({ label: r, category: 'structure' as const, count: 1 }))
    }

  } else {
    // Modeling or Project — use AI but sanitize output
    onProgress?.('⚡ Generating...', 30)

    const systemPrompt = systemType === 'modeling'
      ? `You are a Roblox vehicle builder. Generate vehicle parts as JSON. Use ONLY Block shapes. Output ONLY valid JSON.`
      : `You are a Roblox world builder. Generate map parts as JSON. Use ONLY Block shapes. Output ONLY valid JSON.`

    const userPrompt = `Build: "${prompt}". Return JSON:
{"models":[{"name":"Name","parts":[{"name":"Part","size":{"x":4,"y":1,"z":8},"position":{"x":0,"y":0.5,"z":0},"color":"Medium stone grey","material":"SmoothPlastic","anchored":true,"transparency":0,"shape":"Block"}],"scripts":[],"children":[]}],"spec":[{"label":"Main","category":"structure","count":1}]}`

    try {
      const genText = await geminiGenerate(systemPrompt, userPrompt, 5000)
      const clean = genText.replace(/```json|```/g, '').trim()
      const genData = JSON.parse(clean)
      genData.models[0].parts = sanitizeParts(genData.models[0].parts)

      let rbxmx = buildRbxmx(genData.models)
      const validation = validateRbxmx(rbxmx)
      if (validation.fixed) rbxmx = validation.fixed
      if (userId && generationId) rbxmx = watermarkRbxmx(rbxmx, generationId, userId)
      if (userId) await savePromptHistory(userId, { prompt, system_type: systemType, quality_score: 82 }).catch(() => {})
      onProgress?.('✅ Complete!', 100)
      return { rbxmx, spec: genData.spec || [], qualityScore: 82, qualityNotes: 'AI generated.', quantity: 1, validationWarnings: [] }
    } catch {
      throw new Error('Generation failed — please try again')
    }
  }

  // Build final rbxmx from parts
  onProgress?.('📦 Compiling .rbxmx...', 85)
  allParts = sanitizeParts(allParts)

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
  if (userId) await savePromptHistory(userId, { prompt, system_type: systemType, quality_score: 92 }).catch(() => {})

  onProgress?.('✅ Complete!', 100)
  return { rbxmx, spec, qualityScore: 92, qualityNotes: 'Blueprint generated.', quantity: 1, validationWarnings: [...validation.warnings, ...validation.tosIssues] }
}

import fs from 'fs'
import path from 'path'

export interface BuildingSpec {
  buildingType: string
  description?: string
  architecturalStyle?: string
  floors?: number
  width?: number
  depth?: number
  floorHeight?: number
  exteriorColor?: string
  roofColor?: string
  exteriorMaterial?: string
  accentColor?: string
  roofType?: string
  hasColonnade?: boolean
  culturalNotes?: string
}

// Load once at module startup
let _refRules: string[] = []
try {
  const ref = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public', 'roblox-reference.json'), 'utf-8')
  )
  _refRules = ref.rules || []
} catch {}

function loadFileSpec(buildingType: string): any {
  try {
    const key = buildingType.replace(/_/g, '-')
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public', 'building-specs', `${key}.json`), 'utf-8')
    )
  } catch {
    return null
  }
}

const MAKE_PART_SYSTEM = `You are a Roblox Lua building generator. Write a complete procedural Lua script that builds a building using makePart() calls.

The makePart function signature is:
  makePart({
    name=string,
    sx=number, sy=number, sz=number,  -- size X/Y/Z
    px=number, py=number, pz=number,  -- position X/Y/Z
    color=string,     -- exact Roblox BrickColor name
    material=string,  -- exact Roblox Material enum name
    transparency=number,  -- 0.0 to 1.0
    partType=string   -- "Part" or "WedgePart" (optional, default Part)
  })

POSITION RULES:
- All positions are world coordinates, center of building at X=0, Z=0
- Building bottom must start at Y=0
- py is the CENTER of the part (py = bottom + sy/2)
- Positive Z = front face, Negative Z = back face

MATERIAL NAMES (use these exact strings):
  SmoothPlastic, Concrete, WoodPlanks, Pebble, Granite, Slate,
  Brick, Glass, Wood, Cobblestone, Sandstone, Marble, Metal

BRICKCOLOR NAMES (use these exact strings):
  "White", "Medium stone grey", "Institutional white", "Reddish brown",
  "Brown", "Really black", "Dark red", "Light blue", "Sand green",
  "Brick yellow", "Bright red", "Sand red", "Dark grey", "Dark orange"

OUTPUT: Write ONLY Lua code. No markdown fences. No explanations.
Start directly with local variables or makePart() calls.`

export function buildLuaPrompt(spec: BuildingSpec): { system: string; user: string } {
  const fileSpec = loadFileSpec(spec.buildingType)

  const floors = spec.floors || fileSpec?.dimensions?.floors || 2
  const width = spec.width || fileSpec?.dimensions?.width || 30
  const depth = spec.depth || fileSpec?.dimensions?.depth || 24
  const floorH = spec.floorHeight || fileSpec?.dimensions?.floorHeight || 10
  const wallColor = spec.exteriorColor || fileSpec?.elements?.walls?.color || 'Medium stone grey'
  const wallMat = spec.exteriorMaterial || fileSpec?.elements?.walls?.material || 'SmoothPlastic'
  const roofColor = spec.roofColor || fileSpec?.elements?.roof?.color || 'Dark red'
  const roofMat = fileSpec?.elements?.roof?.material || 'Pebble'
  const trimColor = fileSpec?.elements?.trim?.color || 'Reddish brown'
  const glassColor = fileSpec?.elements?.windows?.glass_color || 'Light blue'
  const frameColor = fileSpec?.elements?.windows?.frame_color || 'Really black'
  const stoneBaseH = fileSpec?.elements?.stoneBase?.height || 0
  const stoneBaseColor = fileSpec?.elements?.stoneBase?.color || 'Medium stone grey'
  const stoneBaseMat = fileSpec?.elements?.stoneBase?.material || 'Granite'

  const totalHeight = stoneBaseH + floors * floorH
  const halfW = (width / 2).toFixed(2)
  const halfD = (depth / 2).toFixed(2)

  const rulesBlock = _refRules.map((r, i) => `${i + 1}. ${r}`).join('\n')

  const specHints = fileSpec ? `
Building spec: ${fileSpec.name}
Style: ${spec.architecturalStyle || fileSpec.elements?.walls?.notes || ''}
Cultural notes: ${spec.culturalNotes || fileSpec.elements?.windows?.notes || ''}
Has colonnade: ${spec.hasColonnade || fileSpec.elements?.colonnade?.enabled || false}` : ''

  const user = `Build a ${spec.buildingType.replace(/_/g, ' ')} using makePart().
${spec.description ? `Description: ${spec.description}` : ''}
${specHints}

DIMENSIONS:
- Width (X axis): ${width} studs (half = ±${halfW})
- Depth (Z axis): ${depth} studs (half = ±${halfD})
- Floors: ${floors}
- Floor height: ${floorH} studs each
- Total height: ~${totalHeight} studs${stoneBaseH > 0 ? `
- Stone base height: ${stoneBaseH} studs (sits at ground Y=0)` : ''}

COLORS AND MATERIALS:
- Walls: color="${wallColor}", material="${wallMat}"
- Roof: color="${roofColor}", material="${roofMat}"
- Trim/frames: color="${trimColor}", material="WoodPlanks"
- Windows: color="${glassColor}", material="Glass", transparency=0.3
- Window frames: color="${frameColor}", material="WoodPlanks"${stoneBaseH > 0 ? `
- Stone base: color="${stoneBaseColor}", material="${stoneBaseMat}"` : ''}

MATERIAL RULES:
${rulesBlock}

REQUIRED ELEMENTS (include ALL of these):
1. ${stoneBaseH > 0 ? `Stone base (height ${stoneBaseH}, full width ${width}x${depth})` : 'Foundation slab (thin, full width)'}
2. Four walls per floor (loop through ${floors} floors) - use hollow box approach:
   - Front wall (pz = +halfDepth, thin in Z)
   - Back wall (pz = -halfDepth, thin in Z)
   - Left wall (px = -halfWidth, thin in X)
   - Right wall (px = +halfWidth, thin in X)
3. Windows on front and back walls (3-4 per floor, use a for loop)
   - Window frames (thin, dark, slightly proud of wall)
   - Glass panes (transparent, inside frame)
4. Entrance door on front face (ground floor, centered)
5. Roof slab (${roofColor}, extends ${spec.hasColonnade ? '3' : '2'} studs past walls on each side)
6. Roof fascia trim on all 4 sides

Use local variables for repeated values:
  local W, D, FH = ${width}, ${depth}, ${floorH}
  local hW, hD = W/2, D/2

Write the complete Lua script now:`

  return { system: MAKE_PART_SYSTEM, user }
}

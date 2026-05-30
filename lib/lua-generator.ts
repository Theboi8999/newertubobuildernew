import { RbxPart } from './rbxmx'
import type { ResearchResult } from './research-agent'
import { buildOttomanHouse } from './modes/ottoman-house'

const MAT_LUA: Record<string, string> = {
  concrete: 'Concrete',
  woodplanks: 'WoodPlanks',
  glass: 'Glass',
  slate: 'Slate',
  pebble: 'Pebble',
  granite: 'Granite',
  smoothplastic: 'SmoothPlastic',
  brick: 'Brick',
  wood: 'Wood',
  metal: 'Metal',
  marble: 'Marble',
  fabric: 'Fabric',
  neon: 'Neon',
  sand: 'Sand',
  ice: 'Ice',
  cobblestone: 'Cobblestone',
  sandstone: 'Sandstone',
  corrodedmetal: 'CorrodedMetal',
}

function fmt(v: number): string {
  return parseFloat(v.toFixed(4)).toString()
}

function partToLua(part: RbxPart): string {
  const mat = MAT_LUA[(part.material || '').toLowerCase().trim()] ?? 'SmoothPlastic'
  const partType = part.partType ?? 'Part'
  const r00 = part.r00 ?? 1; const r01 = part.r01 ?? 0; const r02 = part.r02 ?? 0
  const r10 = part.r10 ?? 0; const r11 = part.r11 ?? 1; const r12 = part.r12 ?? 0
  const r20 = part.r20 ?? 0; const r21 = part.r21 ?? 0; const r22 = part.r22 ?? 1
  const transparency = part.transparency ?? 0

  const fields = [
    `name="${part.name}"`,
    `sx=${fmt(part.size.x)},sy=${fmt(part.size.y)},sz=${fmt(part.size.z)}`,
    `px=${fmt(part.position.x)},py=${fmt(part.position.y)},pz=${fmt(part.position.z)}`,
    `color="${part.color}"`,
    `material="${mat}"`,
    `transparency=${fmt(transparency)}`,
    `r00=${fmt(r00)},r01=${fmt(r01)},r02=${fmt(r02)}`,
    `r10=${fmt(r10)},r11=${fmt(r11)},r12=${fmt(r12)}`,
    `r20=${fmt(r20)},r21=${fmt(r21)},r22=${fmt(r22)}`,
  ]
  if (partType !== 'Part') fields.push(`partType="${partType}"`)

  return `makePart({${fields.join(',')}})`
}

// Parts from buildOttomanHouse that we replace with corrected versions below.
// Part_27 is excluded because it has an upside-down rotation matrix (r11=-1, r22=-1).
const OTTOMAN_REPLACED_NAMES = new Set([
  'RoofEave', 'RoofMid1', 'RoofMid2', 'RoofRidge',
  'FasciaF', 'FasciaB', 'FasciaL', 'FasciaR', 'StoneBase',
  'Part_27',
])

const OTTOMAN_EXTRA_PARTS: RbxPart[] = [
  // Stone base v2 — sy=5.94 meets wall bottom at 5.9398 exactly
  {
    name: 'StoneBase', size: { x: 26, y: 8.0, z: 25.6 },
    position: { x: -0.266, y: 4.0, z: 0.394 },
    color: 'Medium stone grey', material: 'granite', anchored: true, transparency: 0,
  },
  // Exact roof plate from Part_27, corrected to identity rotation
  {
    name: 'RoofPlate', size: { x: 25.52, y: 0.2, z: 25.93 },
    position: { x: 0, y: 24.44, z: 0 },
    color: 'Dark red', material: 'pebble', anchored: true, transparency: 0,
  },
  // Broad flat roof slab sitting below the plate
  {
    name: 'RoofMain', size: { x: 33, y: 0.5, z: 31 },
    position: { x: 0, y: 23.8, z: 0 },
    color: 'Dark red', material: 'pebble', anchored: true, transparency: 0,
  },
  // Fascia trim around roof perimeter
  {
    name: 'FasciaF', size: { x: 33, y: 1.2, z: 0.4 },
    position: { x: 0, y: 23.2, z: 15.5 },
    color: 'Reddish brown', material: 'woodplanks', anchored: true, transparency: 0,
  },
  {
    name: 'FasciaB', size: { x: 33, y: 1.2, z: 0.4 },
    position: { x: 0, y: 23.2, z: -15.5 },
    color: 'Reddish brown', material: 'woodplanks', anchored: true, transparency: 0,
  },
  {
    name: 'FasciaL', size: { x: 0.4, y: 1.2, z: 31 },
    position: { x: -15.5, y: 23.2, z: 0 },
    color: 'Reddish brown', material: 'woodplanks', anchored: true, transparency: 0,
  },
  {
    name: 'FasciaR', size: { x: 0.4, y: 1.2, z: 31 },
    position: { x: 15.5, y: 23.2, z: 0 },
    color: 'Reddish brown', material: 'woodplanks', anchored: true, transparency: 0,
  },
  // Front door
  {
    name: 'Door', size: { x: 3.5, y: 5.5, z: 0.2 },
    position: { x: 0, y: 4.5, z: -12.8 },
    color: 'Reddish brown', material: 'woodplanks', anchored: true, transparency: 0,
  },
]

export function generateLuaScript(researchResult: ResearchResult, parts: RbxPart[]): string {
  let finalParts: RbxPart[]

  if (researchResult.buildingType === 'ottoman_house') {
    const ottomanParts = buildOttomanHouse(0)
    const wallParts = ottomanParts
      .filter(p => !OTTOMAN_REPLACED_NAMES.has(p.name))
      .map(p => {
        if (p.name === 'Part_1' || p.name === 'Part_101') return { ...p, color: 'Medium stone grey', material: 'smoothplastic' }
        if (p.material === 'glass') return { ...p, transparency: 0.3 }
        return p
      })
    finalParts = [...wallParts, ...OTTOMAN_EXTRA_PARTS]
  } else {
    finalParts = parts
  }

  const header = `-- TurboBuilder: ${researchResult.buildingType} (${finalParts.length} parts)`
  return [header, ...finalParts.map(partToLua)].join('\n')
}

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

// Parts from buildOttomanHouse that we exclude.
// Part_27: upside-down rotation matrix (r11=-1, r22=-1).
// Part_26, Part_86: door frame planks at py≈0.12 sy≈5.7 → bottom≈-2.73, causing wrong yOffset.
// Part_3, Part_25: tiny 0.05×1.0×0.11 slate threshold pieces at py=0 → bottom=-0.5.
// Removing all four gives minBottomY=0 (StoneBase bottom) so yOffset=0 and terrain alignment is exact.
const OTTOMAN_REPLACED_NAMES = new Set([
  'RoofEave', 'RoofMid1', 'RoofMid2', 'RoofRidge',
  'FasciaF', 'FasciaB', 'FasciaL', 'FasciaR', 'StoneBase',
  'Part_27',
  'Part_26', 'Part_86',
  'Part_3', 'Part_25',
])

const OTTOMAN_EXTRA_PARTS: RbxPart[] = [
  // Stone base — bottom at Y=0 before ground offset is applied
  {
    name: 'StoneBase', size: { x: 30.18, y: 8.67, z: 28.94 },
    position: { x: -0.266, y: 4.335, z: 0.394 },
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
    position: { x: 0, y: 5.7, z: 14.5 },
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
        if (p.material === 'glass') return { ...p, transparency: 0.15 }
        return p
      })
    finalParts = [...wallParts, ...OTTOMAN_EXTRA_PARTS]
  } else {
    finalParts = parts
  }

  // Shift all parts up so the lowest part bottom sits exactly at Y=0.
  // Some ottoman door frames have py≈0.12 with sy=5.66 → bottom≈-2.71.
  // Without this offset the building would be partially underground.
  const minBottomY = Math.min(...finalParts.map(p => p.position.y - p.size.y / 2))
  if (minBottomY < 0) {
    const yOffset = -minBottomY
    finalParts = finalParts.map(p => ({
      ...p,
      position: { ...p.position, y: parseFloat((p.position.y + yOffset).toFixed(4)) },
    }))
  }

  const doorPart = finalParts.find(p => p.name === 'Door')
  console.log('[lua] door part:', JSON.stringify(doorPart))

  const header = `-- TurboBuilder: ${researchResult.buildingType} (${finalParts.length} parts)`

  const terrainAlignSnippet = `
-- Move entire model to sit on terrain
local minY = math.huge
for _, part in pairs(_TB_MODEL:GetDescendants()) do
    if part:IsA("BasePart") then
        local bottom = part.Position.Y - part.Size.Y/2
        if bottom < minY then minY = bottom end
    end
end
local terrainY = workspace.Terrain:GetHeight(Vector3.new(0,0,0)) or 3
local offset = terrainY - minY
_TB_MODEL:PivotTo(_TB_MODEL:GetPivot() * CFrame.new(0, offset, 0))`

  return [header, ...finalParts.map(partToLua), terrainAlignSnippet].join('\n')
}

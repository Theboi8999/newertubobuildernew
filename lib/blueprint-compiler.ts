// lib/blueprint-compiler.ts
import { RbxPart } from './rbxmx'
import { ResearchResult } from './research-agent'

export interface CompiledBlueprint {
  buildingType: string
  rooms: RbxPart[][]
  exterior: RbxPart[]
  totalWidth: number
  totalDepth: number
}

export const VALID_BRICK_COLORS: string[] = [
  'White', 'Institutional white', 'Ghost white', 'Lily white',
  'Light grey', 'Medium stone grey', 'Dark grey', 'Black',
  'Bright red', 'Crimson', 'Neon red', 'Dark red', 'Rust',
  'Bright orange', 'Neon orange', 'Warm yellowish orange',
  'Bright yellow', 'Cool yellow',
  'Bright green', 'Dark green', 'Sand green', 'Medium green', 'Olive green', 'Mint',
  'Bright blue', 'Navy blue', 'Sand blue', 'Light blue', 'Bright bluish green', 'Teal', 'Cyan',
  'Bright violet', 'Lavender',
  'Hot pink', 'Pale Carmine Pink',
  'Reddish brown', 'Brown', 'Pine cone', 'Cashmere',
  'Sand yellow', 'Brick yellow', 'Fossil',
]

const MATERIAL_MAP: Record<string, string> = {
  'smoothplastic': 'smoothplastic',
  'concrete': 'concrete',
  'wood': 'wood',
  'metal': 'metal',
  'fabric': 'fabric',
  'brick': 'brick',
  'marble': 'marble',
}

function validateColor(color: string): string {
  if (!color) return 'Light grey'
  const exact = VALID_BRICK_COLORS.find(c => c.toLowerCase() === color.toLowerCase())
  if (exact) return exact
  const words = color.toLowerCase().split(/\s+/)
  for (const word of words) {
    if (word.length < 3) continue
    const match = VALID_BRICK_COLORS.find(c => c.toLowerCase().includes(word))
    if (match) return match
  }
  return 'Light grey'
}

function validateMaterial(mat: string): string {
  return MATERIAL_MAP[mat?.toLowerCase()] || 'smoothplastic'
}

function compileRoom(
  room: ResearchResult['rooms'][0],
  offsetX: number,
  offsetZ: number
): RbxPart[] {
  const { name, width, depth, height, wallColor, floorColor, floorMaterial, furniture } = room
  const w = Math.max(6, width || 12)
  const d = Math.max(6, depth || 10)
  const h = Math.max(4, height || 10)
  const wc = validateColor(wallColor)
  const fc = validateColor(floorColor)
  const fm = validateMaterial(floorMaterial)
  const t = 0.5

  const parts: RbxPart[] = [
    { name: `${name}_Floor`, size: { x: w, y: 0.5, z: d }, position: { x: offsetX, y: 0.25, z: offsetZ }, color: fc, material: fm, anchored: true, transparency: 0 },
    { name: `${name}_Ceiling`, size: { x: w, y: 0.5, z: d }, position: { x: offsetX, y: h, z: offsetZ }, color: wc, material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: `${name}_WallNorth`, size: { x: w, y: h, z: t }, position: { x: offsetX, y: h / 2, z: offsetZ - d / 2 }, color: wc, material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: `${name}_WallSouth`, size: { x: w, y: h, z: t }, position: { x: offsetX, y: h / 2, z: offsetZ + d / 2 }, color: wc, material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: `${name}_WallWest`, size: { x: t, y: h, z: d }, position: { x: offsetX - w / 2, y: h / 2, z: offsetZ }, color: wc, material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: `${name}_WallEast`, size: { x: t, y: h, z: d }, position: { x: offsetX + w / 2, y: h / 2, z: offsetZ }, color: wc, material: 'smoothplastic', anchored: true, transparency: 0 },
  ]

  for (let fi = 0; fi < (furniture || []).length; fi++) {
    const item = furniture[fi]
    const fx = offsetX + (fi % 3 - 1) * 3
    const fz = offsetZ + (Math.floor(fi / 3) - 1) * 3
    parts.push({
      name: `${name}_${item.name}`,
      size: { x: Math.max(0.5, item.size?.x || 2), y: Math.max(0.5, item.size?.y || 1), z: Math.max(0.5, item.size?.z || 2) },
      position: { x: fx, y: (item.size?.y || 1) / 2 + 0.5, z: fz },
      color: validateColor(item.color || 'Reddish brown'),
      material: validateMaterial(item.material || 'wood'),
      anchored: true,
      transparency: 0,
    })
  }

  return parts
}

export function compileBlueprint(research: ResearchResult): CompiledBlueprint {
  const rooms: RbxPart[][] = []
  const COLS = 2
  let cursorX = 0
  let cursorZ = 0
  let rowMaxDepth = 0

  for (let i = 0; i < research.rooms.length; i++) {
    const room = research.rooms[i]
    const w = Math.max(6, room.width || 12)
    const d = Math.max(6, room.depth || 10)
    const col = i % COLS

    if (col === 0 && i > 0) {
      cursorZ += rowMaxDepth + 2
      cursorX = 0
      rowMaxDepth = 0
    }

    const offsetX = cursorX + w / 2
    const offsetZ = cursorZ + d / 2

    rooms.push(compileRoom(room, offsetX, offsetZ))

    cursorX += w + 2
    rowMaxDepth = Math.max(rowMaxDepth, d)
  }

  const tw = Math.max(research.totalWidth || 40, cursorX + 10)
  const td = Math.max(research.totalDepth || 30, cursorZ + rowMaxDepth + 10)

  const exterior: RbxPart[] = [
    { name: 'Exterior_Floor', size: { x: tw, y: 1, z: td }, position: { x: tw / 2, y: 0, z: td / 2 }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0 },
    { name: 'Exterior_WallNorth', size: { x: tw, y: 14, z: 1 }, position: { x: tw / 2, y: 7, z: 0 }, color: validateColor(research.exteriorColor), material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: 'Exterior_WallSouth', size: { x: tw, y: 14, z: 1 }, position: { x: tw / 2, y: 7, z: td }, color: validateColor(research.exteriorColor), material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: 'Exterior_WallWest', size: { x: 1, y: 14, z: td }, position: { x: 0, y: 7, z: td / 2 }, color: validateColor(research.exteriorColor), material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: 'Exterior_WallEast', size: { x: 1, y: 14, z: td }, position: { x: tw, y: 7, z: td / 2 }, color: validateColor(research.exteriorColor), material: 'smoothplastic', anchored: true, transparency: 0 },
    { name: 'Exterior_Roof', size: { x: tw + 2, y: 1, z: td + 2 }, position: { x: tw / 2, y: 14.5, z: td / 2 }, color: validateColor(research.roofColor), material: 'smoothplastic', anchored: true, transparency: 0 },
  ]

  return { buildingType: research.buildingType, rooms, exterior, totalWidth: tw, totalDepth: td }
}

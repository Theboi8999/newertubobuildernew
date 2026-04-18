// lib/blueprint-compiler.ts
import { RbxPart } from './rbxmx'
import { ResearchResult } from './research-agent'
import { PROP_LIBRARY } from './model-library'
import type { QualityTarget } from './vision-analyzer'
import {
  buildDetailedWall, buildDetailedFloor, buildDetailedCeiling,
  buildDetailedDoor, buildWallDetails,
  buildDetailedDesk, buildDetailedChair, buildDetailedShelf, buildDetailedLocker,
} from './detail-system'

export interface RoomLayoutItem {
  name: string
  type: string
  x: number
  z: number
  width: number
  depth: number
}

export interface CompiledBlueprint {
  buildingType: string
  rooms: RbxPart[][]
  exterior: RbxPart[]
  totalWidth: number
  totalDepth: number
  roomLayout: RoomLayoutItem[]
}

interface ColorTheme {
  exterior: string
  roof: string
  trim: string
  floor: string
}

const BUILDING_COLOR_THEMES: Record<string, ColorTheme> = {
  'convenience': { exterior: 'Bright green',      roof: 'White',      trim: 'White',             floor: 'White' },
  'konbini':     { exterior: 'Bright green',      roof: 'White',      trim: 'White',             floor: 'White' },
  'supermarket': { exterior: 'Bright blue',       roof: 'White',      trim: 'White',             floor: 'White' },
  'police':      { exterior: 'Navy blue',         roof: 'Dark grey',  trim: 'White',             floor: 'Medium stone grey' },
  'hospital':    { exterior: 'White',             roof: 'White',      trim: 'Bright blue',       floor: 'White' },
  'school':      { exterior: 'Brick yellow',      roof: 'Reddish brown', trim: 'White',          floor: 'Sand yellow' },
  'fire':        { exterior: 'Bright red',        roof: 'Dark grey',  trim: 'White',             floor: 'Medium stone grey' },
  'restaurant':  { exterior: 'Reddish brown',     roof: 'Dark red',   trim: 'Bright yellow',     floor: 'Sand yellow' },
  'stadium':     { exterior: 'Medium stone grey', roof: 'Dark grey',  trim: 'Bright blue',       floor: 'Bright green' },
  'office':      { exterior: 'Medium stone grey', roof: 'Dark grey',  trim: 'Institutional white', floor: 'Medium stone grey' },
  'hotel':       { exterior: 'Sand yellow',       roof: 'Dark grey',  trim: 'Bright yellow',     floor: 'Sand yellow' },
  'airport':     { exterior: 'White',             roof: 'Light grey', trim: 'Bright blue',       floor: 'Light grey' },
  'train':       { exterior: 'Medium stone grey', roof: 'Dark grey',  trim: 'Bright red',        floor: 'Medium stone grey' },
  'bank':        { exterior: 'Sand yellow',       roof: 'Dark grey',  trim: 'Dark grey',         floor: 'Institutional white' },
  'default':     { exterior: 'Light grey',        roof: 'Dark grey',  trim: 'White',             floor: 'Medium stone grey' },
}

const RETAIL_KEYWORDS = ['store', 'shop', 'restaurant', 'cafe', 'mall', 'market', 'convenience', 'supermarket', 'pharmacy']

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

const COLOR_ALIASES: Record<string, string> = {
  'beige': 'Sand yellow', 'cream': 'White', 'ivory': 'White',
  'off-white': 'Institutional white', 'off white': 'Institutional white',
  'tan': 'Sand yellow', 'khaki': 'Sand yellow', 'natural': 'Sand yellow',
  'charcoal': 'Dark grey', 'slate': 'Medium stone grey', 'concrete': 'Medium stone grey',
  'stone': 'Medium stone grey', 'silver': 'Medium stone grey',
  'aluminium': 'Light grey', 'aluminum': 'Light grey', 'steel': 'Dark grey',
  'navy': 'Navy blue', 'dark blue': 'Navy blue',
  'forest': 'Dark green', 'forest green': 'Dark green', 'dark green': 'Dark green',
  'lime': 'Bright green', 'lime green': 'Bright green',
  'sky': 'Light blue', 'sky blue': 'Light blue', 'light blue': 'Light blue',
  'coral': 'Bright orange', 'salmon': 'Pale Carmine Pink',
  'maroon': 'Dark red', 'crimson red': 'Crimson',
  'golden': 'Bright yellow', 'gold': 'Bright yellow',
  'terracotta': 'Rust', 'terracotta red': 'Rust',
  'hardwood': 'Reddish brown', 'oak': 'Reddish brown', 'mahogany': 'Reddish brown',
  'gray': 'Medium stone grey', 'grey': 'Medium stone grey',
  'light gray': 'Light grey', 'dark gray': 'Dark grey',
  'orange': 'Bright orange', 'yellow': 'Bright yellow',
  'green': 'Bright green', 'blue': 'Bright blue',
  'red': 'Bright red', 'purple': 'Bright violet',
  'pink': 'Hot pink', 'brown': 'Reddish brown',
}

const MATERIAL_MAP: Record<string, string> = {
  'smoothplastic': 'smoothplastic', 'plastic': 'smoothplastic',
  'concrete': 'concrete', 'wood': 'wood', 'metal': 'metal',
  'fabric': 'fabric', 'brick': 'brick', 'marble': 'marble',
  'neon': 'neon', 'glass': 'smoothplastic',
  'tile': 'smoothplastic', 'carpet': 'fabric', 'linoleum': 'smoothplastic',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getColorTheme(buildingType: string): ColorTheme {
  const normalized = buildingType.toLowerCase().replace(/_/g, ' ')
  for (const key of Object.keys(BUILDING_COLOR_THEMES)) {
    if (key !== 'default' && normalized.includes(key)) {
      return BUILDING_COLOR_THEMES[key]
    }
  }
  return BUILDING_COLOR_THEMES['default']
}

function isRetailType(buildingType: string): boolean {
  const bt = buildingType.toLowerCase()
  return RETAIL_KEYWORDS.some(k => bt.includes(k))
}

export function validateColor(color: string): string {
  if (!color) return 'Light grey'
  const lower = color.toLowerCase().trim()
  if (COLOR_ALIASES[lower]) return COLOR_ALIASES[lower]
  const exact = VALID_BRICK_COLORS.find(c => c.toLowerCase() === lower)
  if (exact) return exact
  const words = lower.split(/[\s\-_]+/)
  for (const word of words) {
    if (word.length < 4) continue
    const match = VALID_BRICK_COLORS.find(c => c.toLowerCase().includes(word))
    if (match) return match
  }
  return 'Light grey'
}

export function validateMaterial(mat: string): string {
  if (!mat) return 'smoothplastic'
  return MATERIAL_MAP[mat.toLowerCase()] || 'smoothplastic'
}

function p(
  name: string,
  sx: number, sy: number, sz: number,
  px: number, py: number, pz: number,
  color: string, mat: string,
  transparency = 0
): RbxPart {
  return {
    name,
    size: { x: sx, y: sy, z: sz },
    position: { x: px, y: py, z: pz },
    color, material: mat, anchored: true, transparency,
  }
}

// ── Placement-aware furniture ──────────────────────────────────────────────

type FurnitureItem = NonNullable<ResearchResult['rooms'][0]['furniture']>[0]

function spawnFurniturePart(item: FurnitureItem, tag: string, fx: number, fz: number): RbxPart[] {
  const fw = Math.max(0.5, Number(item.size?.x) || 2)
  const fh = Math.max(0.5, Number(item.size?.y) || 1)
  const fd = Math.max(0.5, Number(item.size?.z) || 2)
  const color = validateColor(item.color || 'Reddish brown')
  const mat = validateMaterial(item.material || 'wood')
  const n = item.name.toLowerCase()

  if (n.includes('desk')) {
    return buildDetailedDesk({ name: tag, x: fx, y: 1, z: fz, width: fw, depth: fd, deskColor: color }) as RbxPart[]
  }
  if (n.includes('chair') || n.includes('seat')) {
    return buildDetailedChair({ name: tag, x: fx, y: 1, z: fz, color }) as RbxPart[]
  }
  if (n.includes('shelf') || n.includes('shelv') || n.includes('rack')) {
    return buildDetailedShelf({ name: tag, x: fx, y: 0, z: fz, width: fw, depth: fd, color }) as RbxPart[]
  }
  if (n.includes('locker')) {
    return buildDetailedLocker({ name: tag, x: fx, y: 0, z: fz, color }) as RbxPart[]
  }
  return [p(tag, fw, fh, fd, fx, 1 + fh / 2, fz, color, mat)]
}

function placeAlongWall(
  items: FurnitureItem[],
  roomName: string,
  offsetX: number,
  offsetZ: number,
  w: number,
  d: number,
  wall: 'north_wall' | 'south_wall' | 'east_wall' | 'west_wall',
): RbxPart[] {
  const parts: RbxPart[] = []
  if (!items.length) return parts
  const margin = 1.2
  let cursor = 0

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1)
    const fw = Math.max(0.5, Number(item.size?.x) || 2)
    const fd = Math.max(0.5, Number(item.size?.z) || 2)
    const isHoriz = wall === 'north_wall' || wall === 'south_wall'
    const step = (isHoriz ? fw : fd) + 0.5

    for (let q = 0; q < qty; q++) {
      let fx: number, fz: number

      if (wall === 'north_wall') {
        fx = offsetX - w / 2 + margin + cursor + fw / 2
        fz = offsetZ - d / 2 + fd / 2 + margin
      } else if (wall === 'south_wall') {
        fx = offsetX - w / 2 + margin + cursor + fw / 2
        fz = offsetZ + d / 2 - fd / 2 - margin
      } else if (wall === 'west_wall') {
        fx = offsetX - w / 2 + fw / 2 + margin
        fz = offsetZ - d / 2 + margin + cursor + fd / 2
      } else {
        fx = offsetX + w / 2 - fw / 2 - margin
        fz = offsetZ - d / 2 + margin + cursor + fd / 2
      }

      fx = Math.min(offsetX + w / 2 - margin, Math.max(offsetX - w / 2 + margin, fx))
      fz = Math.min(offsetZ + d / 2 - margin, Math.max(offsetZ - d / 2 + margin, fz))

      parts.push(...spawnFurniturePart(item, `${roomName}_${item.name}_${q}`, fx, fz))
      cursor += step
    }
  }
  return parts
}

function placeInRows(
  items: FurnitureItem[],
  roomName: string,
  offsetX: number,
  offsetZ: number,
  w: number,
  d: number,
): RbxPart[] {
  const parts: RbxPart[] = []
  if (!items.length) return parts
  const margin = 1.5
  let fi = 0

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1)
    const fw = Math.max(0.5, Number(item.size?.x) || 2)
    const fd = Math.max(0.5, Number(item.size?.z) || 2)

    for (let q = 0; q < qty; q++) {
      const cols = Math.max(1, Math.floor((w - margin * 2) / (fw + 1)))
      const col = fi % cols
      const row = Math.floor(fi / cols)
      const fx = Math.min(
        offsetX + w / 2 - margin,
        Math.max(offsetX - w / 2 + margin, offsetX - w / 2 + margin + col * (fw + 1) + fw / 2)
      )
      const fz = Math.min(
        offsetZ + d / 2 - margin,
        Math.max(offsetZ - d / 2 + margin, offsetZ - d / 2 + margin + row * (fd + 1) + fd / 2)
      )
      parts.push(...spawnFurniturePart(item, `${roomName}_${item.name}_${q}`, fx, fz))
      fi++
    }
  }
  return parts
}

// ── Room compiler ──────────────────────────────────────────────────────────

function compileRoom(
  room: ResearchResult['rooms'][0],
  offsetX: number,
  offsetZ: number,
  theme: ColorTheme,
): RbxPart[] {
  const { name, floorMaterial } = room
  const w = Math.max(8, Number(room.width) || 12)
  const d = Math.max(8, Number(room.depth) || 10)
  const h = Math.max(5, Number(room.height) || 10)
  const fm = validateMaterial(floorMaterial)

  const parts: RbxPart[] = [
    ...(buildDetailedFloor({ name, x: offsetX, z: offsetZ, width: w, depth: d, color: theme.floor, material: fm, hasBorderTiles: true }) as RbxPart[]),
    ...(buildDetailedCeiling({ name, x: offsetX, z: offsetZ, width: w, depth: d, height: h, color: 'White', lightCount: Math.max(1, Math.floor(w / 8)), hasAirVents: w >= 12 }) as RbxPart[]),
    ...(buildDetailedWall({ name: `${name}_N`, x: offsetX, y: h / 2, z: offsetZ - d / 2, width: w, height: h, direction: 'north', color: 'Light grey', material: 'smoothplastic', hasSkirtingBoard: true, hasCornicing: true }) as RbxPart[]),
    ...(buildDetailedWall({ name: `${name}_S`, x: offsetX, y: h / 2, z: offsetZ + d / 2, width: w, height: h, direction: 'south', color: 'Light grey', material: 'smoothplastic', hasSkirtingBoard: true, hasCornicing: true }) as RbxPart[]),
    ...(buildDetailedWall({ name: `${name}_W`, x: offsetX - w / 2, y: h / 2, z: offsetZ, width: d, height: h, direction: 'west', color: 'Light grey', material: 'smoothplastic', hasSkirtingBoard: true }) as RbxPart[]),
    ...(buildDetailedWall({ name: `${name}_E`, x: offsetX + w / 2, y: h / 2, z: offsetZ, width: d, height: h, direction: 'east', color: 'Light grey', material: 'smoothplastic', hasSkirtingBoard: true }) as RbxPart[]),
    ...(buildDetailedDoor({ name: `${name}_Door`, x: offsetX, y: 0, z: offsetZ + d / 2, direction: 'south' }) as RbxPart[]),
    ...(buildWallDetails({ name: `${name}_WD`, x: offsetX - w / 2 + 1, y: h / 2, z: offsetZ, width: d, height: h, direction: 'west', hasPowerSocket: true, hasLightSwitch: true, hasRadiator: h >= 8 }) as RbxPart[]),
  ]

  const furniture = room.furniture || []
  const northItems = furniture.filter(f => f.placement === 'north_wall')
  const southItems = furniture.filter(f => f.placement === 'south_wall')
  const eastItems  = furniture.filter(f => f.placement === 'east_wall')
  const westItems  = furniture.filter(f => f.placement === 'west_wall')
  const rowItems   = furniture.filter(f => f.placement === 'row')
  const centerItems = furniture.filter(f => f.placement === 'center' || !f.placement)

  parts.push(
    ...placeAlongWall(northItems, name, offsetX, offsetZ, w, d, 'north_wall'),
    ...placeAlongWall(southItems, name, offsetX, offsetZ, w, d, 'south_wall'),
    ...placeAlongWall(eastItems,  name, offsetX, offsetZ, w, d, 'east_wall'),
    ...placeAlongWall(westItems,  name, offsetX, offsetZ, w, d, 'west_wall'),
    ...placeInRows([...rowItems, ...centerItems], name, offsetX, offsetZ, w, d),
  )

  return parts
}

// ── Retail add-ons ─────────────────────────────────────────────────────────

function addRetailShelving(roomName: string, offsetX: number, offsetZ: number, w: number, d: number): RbxPart[] {
  const parts: RbxPart[] = []
  const shelfLength = Math.min(d - 3, 8)
  const maxColumns = Math.floor((w - 6) / 4)

  for (let i = 0; i < maxColumns; i++) {
    const sx = offsetX - w / 2 + 3 + i * 4
    if (sx > offsetX + w / 2 - 3) break

    parts.push(p(`${roomName}_Shelf1_${i}`,    1, 4, shelfLength, sx,     2.5, offsetZ, 'White',      'smoothplastic'))
    parts.push(p(`${roomName}_ShelfTop1_${i}`, 1, 0.3, shelfLength, sx,   4.3, offsetZ, 'Light grey', 'smoothplastic'))
    parts.push(p(`${roomName}_ShelfMid1_${i}`, 1, 0.3, shelfLength, sx,   2.3, offsetZ, 'Light grey', 'smoothplastic'))

    const sx2 = sx + 2
    if (sx2 <= offsetX + w / 2 - 2) {
      parts.push(p(`${roomName}_Shelf2_${i}`,    1, 4, shelfLength, sx2,   2.5, offsetZ, 'White',      'smoothplastic'))
      parts.push(p(`${roomName}_ShelfTop2_${i}`, 1, 0.3, shelfLength, sx2, 4.3, offsetZ, 'Light grey', 'smoothplastic'))
      parts.push(p(`${roomName}_ShelfMid2_${i}`, 1, 0.3, shelfLength, sx2, 2.3, offsetZ, 'Light grey', 'smoothplastic'))
    }
  }
  return parts
}

function addCheckoutCounter(roomName: string, offsetX: number, offsetZ: number, d: number): RbxPart[] {
  const cz = offsetZ + d / 2 - 4
  return [
    p(`${roomName}_CounterBase`, 8, 3,   2, offsetX,     1.5,  cz, 'White',      'smoothplastic'),
    p(`${roomName}_CounterTop`,  8, 0.3, 2, offsetX,     3.15, cz, 'Light grey', 'smoothplastic'),
    p(`${roomName}_Register`,  1.5, 1.5, 1, offsetX - 2, 3.75, cz, 'Dark grey',  'smoothplastic'),
  ]
}

// ── Exterior ───────────────────────────────────────────────────────────────

function buildExteriorWalls(
  tw: number, td: number, height: number,
  theme: ColorTheme, buildingType: string,
  exteriorFeatures?: ResearchResult['exteriorFeatures'],
): RbxPart[] {
  const ec = theme.exterior
  const rc = theme.roof
  const tc = theme.trim
  const retail = isRetailType(buildingType)
  const feat = exteriorFeatures || {}

  const parts: RbxPart[] = [
    // Ground slab
    p('Exterior_Ground',     tw + 30, 1, td + 30, tw / 2,  0,            td / 2,   'Medium stone grey', 'concrete'),
    // Perimeter walls
    p('Exterior_WallSouth',  tw, height, 1, tw / 2, height / 2, td,    ec, 'smoothplastic'),
    p('Exterior_WallWest',   1, height, td, 0,      height / 2, td / 2, ec, 'smoothplastic'),
    p('Exterior_WallEast',   1, height, td, tw,     height / 2, td / 2, ec, 'smoothplastic'),
    // Roof slab
    p('Exterior_Roof',       tw + 2, 1, td + 2, tw / 2, height + 0.5, td / 2, rc, 'smoothplastic'),
    // Roof edge trim
    p('Exterior_RoofTrimF',  tw + 2, 0.8, 0.8, tw / 2,    height + 0.1, -0.4,      tc, 'smoothplastic'),
    p('Exterior_RoofTrimB',  tw + 2, 0.8, 0.8, tw / 2,    height + 0.1, td + 0.4,  tc, 'smoothplastic'),
    p('Exterior_RoofTrimL',  0.8,   0.8, td + 2, -0.4,    height + 0.1, td / 2,    tc, 'smoothplastic'),
    p('Exterior_RoofTrimR',  0.8,   0.8, td + 2, tw + 0.4, height + 0.1, td / 2,   tc, 'smoothplastic'),
    // Corner pillars
    p('Exterior_PillarNW', 1.5, height, 1.5, 0.75,      height / 2, 0.75,      ec, 'smoothplastic'),
    p('Exterior_PillarNE', 1.5, height, 1.5, tw - 0.75, height / 2, 0.75,      ec, 'smoothplastic'),
    p('Exterior_PillarSW', 1.5, height, 1.5, 0.75,      height / 2, td - 0.75, ec, 'smoothplastic'),
    p('Exterior_PillarSE', 1.5, height, 1.5, tw - 0.75, height / 2, td - 0.75, ec, 'smoothplastic'),
  ]

  // Roof details — HVAC / AC units
  const hvacCount = Math.max(1, Math.floor(tw / 20))
  for (let i = 0; i < hvacCount; i++) {
    const hx = tw * 0.25 + i * (tw / (hvacCount + 1))
    parts.push(p(`Roof_HVAC_${i}`,    4, 2, 3, hx, height + 1.5, td / 2 + i * 4, 'Dark grey', 'metal'))
    parts.push(p(`Roof_HVAC_Fan_${i}`, 3, 0.3, 3, hx, height + 2.65, td / 2 + i * 4, 'Medium stone grey', 'metal'))
  }

  // Bollards near entrance
  const bollardCount = 4
  for (let i = 0; i < bollardCount; i++) {
    const bx = tw / 2 - 6 + i * 4
    parts.push(p(`Bollard_${i}_Post`,  0.6, 3, 0.6, bx, 1.5, -3, 'Dark grey', 'metal'))
    parts.push(p(`Bollard_${i}_Top`,   0.8, 0.4, 0.8, bx, 3.2, -3, 'Bright yellow', 'smoothplastic'))
  }

  // Exterior lamp posts on each side of entrance
  parts.push(p('LampPost_L_Pole',  0.4, 8, 0.4, tw / 2 - 8, 4, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_L_Head',  1.5, 0.5, 1.5, tw / 2 - 8, 8.25, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_L_Light', 1, 0.3, 1, tw / 2 - 8, 8, -6, 'Bright yellow', 'neon', 0.1))
  parts.push(p('LampPost_R_Pole',  0.4, 8, 0.4, tw / 2 + 8, 4, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_R_Head',  1.5, 0.5, 1.5, tw / 2 + 8, 8.25, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_R_Light', 1, 0.3, 1, tw / 2 + 8, 8, -6, 'Bright yellow', 'neon', 0.1))

  // Flagpole
  if (feat.hasFlagpole !== false) {
    parts.push(p('Flagpole_Base',  1, 0.5, 1, tw / 2 - tw / 3, 0.25, -8, 'Medium stone grey', 'concrete'))
    parts.push(p('Flagpole_Pole',  0.3, 14, 0.3, tw / 2 - tw / 3, 7, -8, 'Light grey', 'metal'))
    parts.push(p('Flagpole_Flag',  4, 2.5, 0.2, tw / 2 - tw / 3 + 2, 13, -8, 'Bright red', 'fabric'))
  }

  // Fence / perimeter barrier
  if (feat.hasFence) {
    const fenceH = 4
    const postSpacing = 6
    const sidesData: [string, number, number, number, number][] = [
      ['FenceN', tw, fenceH, tw / 2, -10],
      ['FenceS', tw, fenceH, tw / 2, td + 10],
    ]
    for (const [fname, fw2, fh, fx, fz2] of sidesData) {
      parts.push(p(`${fname}_Rail`, fw2, 0.3, 0.3, fx, fh - 0.5, fz2, 'Dark grey', 'metal'))
      parts.push(p(`${fname}_Rail2`, fw2, 0.3, 0.3, fx, fh / 2, fz2, 'Dark grey', 'metal'))
      const postCount = Math.floor(fw2 / postSpacing)
      for (let pi = 0; pi <= postCount; pi++) {
        const px = fx - fw2 / 2 + pi * postSpacing
        parts.push(p(`${fname}_Post_${pi}`, 0.4, fh, 0.4, px, fh / 2, fz2, 'Dark grey', 'metal'))
      }
    }
  }

  // Car park
  if (feat.hasCarPark) {
    const spaces = 6
    const spaceW = 4
    const spaceD = 8
    const parkZ = td + 4
    for (let i = 0; i < spaces; i++) {
      const sx = tw / 2 - (spaces * spaceW) / 2 + i * spaceW + spaceW / 2
      parts.push(p(`CarPark_Space_${i}`, spaceW - 0.3, 0.1, spaceD, sx, 0.55, parkZ + spaceD / 2, 'Medium stone grey', 'smoothplastic'))
      parts.push(p(`CarPark_Line_L_${i}`, 0.2, 0.1, spaceD, sx - spaceW / 2, 0.6, parkZ + spaceD / 2, 'White', 'smoothplastic'))
      parts.push(p(`CarPark_Line_R_${i}`, 0.2, 0.1, spaceD, sx + spaceW / 2, 0.6, parkZ + spaceD / 2, 'White', 'smoothplastic'))
    }
  }

  // Front wall + door
  if (retail) {
    const pillarW = 2
    const glassW  = Math.max(4, tw - pillarW * 2 - 2)
    const glassH  = height - 3

    parts.push(p('Exterior_FrontPillarL', pillarW, height, 1, pillarW / 2 + 1,      height / 2, 0, ec, 'smoothplastic'))
    parts.push(p('Exterior_FrontPillarR', pillarW, height, 1, tw - pillarW / 2 - 1, height / 2, 0, ec, 'smoothplastic'))
    parts.push(p('Exterior_FrontGlass', glassW, glassH, 0.3, tw / 2, glassH / 2 + 0.5, 0, 'Institutional white', 'smoothplastic', 0.3))
    parts.push(p('Exterior_FrontTransom', tw, height - glassH - 0.5, 1, tw / 2, glassH + (height - glassH) / 2, 0, ec, 'smoothplastic'))
    parts.push(p('Exterior_Canopy', tw, 0.8, 4, tw / 2, height * 0.75, -2, tc, 'smoothplastic'))
    parts.push(p('Signage_Panel', Math.max(4, tw - 4), 2.5, 0.3, tw / 2, height - 1, -0.5, ec, 'neon'))
  } else {
    parts.push(p('Exterior_WallNorth',  tw, height, 1, tw / 2, height / 2, 0, ec, 'smoothplastic'))
    parts.push(p('Exterior_DoorFrameL', 0.5, 6, 1.2, tw / 2 - 2.25, 3, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorFrameR', 0.5, 6, 1.2, tw / 2 + 2.25, 3, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorHeader', 4.5, 0.5, 1.2, tw / 2, 6.25, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorGlass',  3.5, 5, 0.2, tw / 2, 3, -0.1, 'Institutional white', 'smoothplastic', 0.5))
    parts.push(p('Exterior_Canopy', Math.min(tw, 12), 0.8, 3, tw / 2, height * 0.75, -1.5, tc, 'smoothplastic'))
    parts.push(p('Signage_Panel', Math.max(4, tw - 6), 2.5, 0.3, tw / 2, height - 1, -0.5, ec, 'neon'))
  }

  return parts
}

// ── Detail padding ─────────────────────────────────────────────────────────

interface RoomMeta { name: string; offsetX: number; offsetZ: number; w: number; d: number; h: number }

function addDetailParts(roomData: RoomMeta[]): RbxPart[] {
  const detail: RbxPart[] = []
  for (const { name, offsetX, offsetZ, w, d, h } of roomData) {
    detail.push(p(`${name}_TrimN`, w,   0.4, 0.4, offsetX,              h - 0.2, offsetZ - d / 2 + 0.2, 'White', 'smoothplastic'))
    detail.push(p(`${name}_TrimS`, w,   0.4, 0.4, offsetX,              h - 0.2, offsetZ + d / 2 - 0.2, 'White', 'smoothplastic'))
    detail.push(p(`${name}_TrimW`, 0.4, 0.4, d,   offsetX - w / 2 + 0.2, h - 0.2, offsetZ,              'White', 'smoothplastic'))
    detail.push(p(`${name}_TrimE`, 0.4, 0.4, d,   offsetX + w / 2 - 0.2, h - 0.2, offsetZ,              'White', 'smoothplastic'))
    detail.push(p(`${name}_BordN`, w,   0.3, 0.3, offsetX,              1.15, offsetZ - d / 2 + 0.15,    'Dark grey', 'smoothplastic'))
    detail.push(p(`${name}_BordS`, w,   0.3, 0.3, offsetX,              1.15, offsetZ + d / 2 - 0.15,    'Dark grey', 'smoothplastic'))
    detail.push(p(`${name}_BordW`, 0.3, 0.3, d,   offsetX - w / 2 + 0.15, 1.15, offsetZ,                'Dark grey', 'smoothplastic'))
    detail.push(p(`${name}_BordE`, 0.3, 0.3, d,   offsetX + w / 2 - 0.15, 1.15, offsetZ,                'Dark grey', 'smoothplastic'))
  }
  return detail
}

// ── Prop library placement ─────────────────────────────────────────────────

function getPropsForRoom(roomName: string, roomX: number, roomZ: number, roomWidth: number, roomDepth: number): RbxPart[] {
  const name = roomName.toLowerCase()
  const insetX = roomWidth / 2 - 3
  const insetZ = roomDepth / 2 - 3

  if (name.includes('checkout') || name.includes('cashier') || name.includes('till')) {
    return PROP_LIBRARY.CHECKOUT_COUNTER(roomX, 0, roomZ + insetZ)
  }
  if (name.includes('refriger') || name.includes('fridge') || name.includes('cold') || name.includes('refrigeration')) {
    return PROP_LIBRARY.REFRIGERATOR_UNIT(roomX + Math.max(0, insetX), 0, roomZ)
  }
  if (name.includes('shelf') || name.includes('sales floor') || name.includes('retail') || name.includes('sales area')) {
    const props: RbxPart[] = []
    const slots = Math.max(1, Math.floor(roomWidth / 6))
    for (let i = 0; i < slots; i++) {
      const sx = roomX - insetX + i * 6
      if (sx > roomX + insetX) break
      props.push(...PROP_LIBRARY.SHELVING_UNIT(sx, 0, roomZ))
    }
    return props
  }
  if (name.includes('holding') || name.includes('detention') || (name.includes('cell') && !name.includes('excel'))) {
    return PROP_LIBRARY.POLICE_CELL(roomX, 0, roomZ)
  }
  if (name.includes('bathroom') || name.includes('toilet') || name.includes('restroom') || name.includes('lavatory') || name.includes(' wc')) {
    return PROP_LIBRARY.TOILET_CUBICLE(roomX, 0, roomZ)
  }
  if (name.includes('reception') || name.includes('lobby') || name.includes('waiting area') || name.includes('front desk')) {
    return PROP_LIBRARY.RECEPTION_DESK(roomX, 0, roomZ - insetZ)
  }
  if (name.includes('meeting') || name.includes('conference') || name.includes('briefing') || name.includes('interrogation')) {
    return [
      ...PROP_LIBRARY.OFFICE_DESK(roomX, 0, roomZ),
      ...PROP_LIBRARY.OFFICE_CHAIR(roomX + 2.5, 0, roomZ + 1.5),
    ]
  }
  if (name.includes('office') || name.includes('admin') || name.includes('principal') || name.includes('staff room') || name.includes('locker')) {
    return [
      ...PROP_LIBRARY.OFFICE_DESK(roomX - Math.max(0, insetX), 0, roomZ),
      ...PROP_LIBRARY.OFFICE_CHAIR(roomX - Math.max(0, insetX) + 2.5, 0, roomZ + 1.5),
    ]
  }
  return []
}

export function getRoomType(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('reception') || n.includes('lobby') || n.includes('entrance')) return 'reception'
  if (n.includes('bathroom') || n.includes('toilet') || n.includes('restroom') || n.includes('lavatory')) return 'bathroom'
  if (n.includes('holding') || n.includes('detention')) return 'holding'
  if (n.includes('cell') && !n.includes('excel')) return 'cell'
  if (n.includes('meeting') || n.includes('conference') || n.includes('briefing') || n.includes('interrogation')) return 'meeting'
  if (n.includes('kitchen') || n.includes('break') || n.includes('canteen')) return 'kitchen'
  if (n.includes('storage') || n.includes('warehouse') || n.includes('stock') || n.includes('evidence')) return 'storage'
  if (n.includes('sales') || n.includes('retail') || n.includes('shopping') || n.includes('shop') || n.includes('checkout')) return 'shopping'
  if (n.includes('locker')) return 'locker'
  if (n.includes('office') || n.includes('admin') || n.includes('dispatch') || n.includes('control')) return 'office'
  if (n.includes('ward') || n.includes('bay') || n.includes('theatre') || n.includes('pharmacy')) return 'medical'
  return 'general'
}

// ── Main entry point ───────────────────────────────────────────────────────

export function compileBlueprint(research: ResearchResult, qualityTarget?: QualityTarget): CompiledBlueprint {
  const buildingType = research.buildingType || 'building'
  let theme = getColorTheme(buildingType)
  if (theme.exterior === 'Light grey' && research.exteriorColor) {
    theme = {
      exterior: validateColor(research.exteriorColor),
      roof: validateColor(research.roofColor || 'Dark grey'),
      trim: 'White',
      floor: theme.floor,
    }
  }
  if (qualityTarget?.colorPalette && qualityTarget.colorPalette.length > 0) {
    theme = { ...theme, floor: validateColor(qualityTarget.colorPalette[0]) }
  }
  const retail = isRetailType(buildingType)

  const COLS = 2
  let cursorX = 3
  let cursorZ = 3
  let rowMaxDepth = 0
  const compiledRooms: RbxPart[][] = []
  const roomMeta: RoomMeta[] = []
  const roomLayout: RoomLayoutItem[] = []

  for (let i = 0; i < research.rooms.length; i++) {
    const room = research.rooms[i]
    const w = Math.max(8, Number(room.width) || 12)
    const d = Math.max(8, Number(room.depth) || 10)
    const h = Math.max(5, Number(room.height) || 10)
    const col = i % COLS

    if (col === 0 && i > 0) {
      cursorZ += rowMaxDepth
      cursorX = 3
      rowMaxDepth = 0
    }

    const offsetX = cursorX + w / 2
    const offsetZ = cursorZ + d / 2

    const roomParts = compileRoom(room, offsetX, offsetZ, theme)

    if (retail && i === 0) {
      roomParts.push(...addRetailShelving(room.name, offsetX, offsetZ, w, d))
      roomParts.push(...addCheckoutCounter(room.name, offsetX, offsetZ, d))
    }

    roomParts.push(...getPropsForRoom(room.name, offsetX, offsetZ, w, d))

    compiledRooms.push(roomParts)
    roomMeta.push({ name: room.name, offsetX, offsetZ, w, d, h })
    roomLayout.push({ name: room.name, type: getRoomType(room.name), x: offsetX, z: offsetZ, width: w, depth: d })

    cursorX += w
    rowMaxDepth = Math.max(rowMaxDepth, d)
  }

  const tw = Math.max(research.totalWidth || 40, cursorX + 6)
  const td = Math.max(research.totalDepth || 30, cursorZ + rowMaxDepth + 6)
  const tallestRoom = Math.max(...research.rooms.map(r => Math.max(5, Number(r.height) || 10)))
  const EXTERIOR_HEIGHT = tallestRoom + 2

  const exterior = buildExteriorWalls(tw, td, EXTERIOR_HEIGHT, theme, buildingType, research.exteriorFeatures)

  const totalNow = compiledRooms.reduce((s, r) => s + r.length, 0) + exterior.length
  const highDetail = (qualityTarget?.detailLevel ?? 0) >= 7
  const isUltra = qualityTarget?.partDensity === 'ultra'

  if (highDetail || isUltra) {
    for (let ri = 0; ri < compiledRooms.length; ri++) {
      compiledRooms[ri] = [...compiledRooms[ri], ...addDetailParts([roomMeta[ri]])]
    }
  } else if (totalNow < 40 && compiledRooms.length > 0) {
    compiledRooms[0] = [...compiledRooms[0], ...addDetailParts(roomMeta)]
  }

  if (isUltra) {
    for (let ri = 0; ri < compiledRooms.length; ri++) {
      const m = roomMeta[ri]
      compiledRooms[ri].push(...addRetailShelving(`${m.name}_x`, m.offsetX, m.offsetZ, m.w, m.d))
    }
  }

  return { buildingType, rooms: compiledRooms, exterior, totalWidth: tw, totalDepth: td, roomLayout }
}

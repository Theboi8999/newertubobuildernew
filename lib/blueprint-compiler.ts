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

interface ColorTheme {
  exterior: string
  roof: string
  trim: string
  floor: string
}

const BUILDING_COLOR_THEMES: Record<string, ColorTheme> = {
  convenience_store: { exterior: 'Bright green', roof: 'White', trim: 'White', floor: 'White' },
  police_station:    { exterior: 'Navy blue',    roof: 'Dark grey', trim: 'White', floor: 'Medium stone grey' },
  hospital:          { exterior: 'White',         roof: 'White',     trim: 'Bright blue', floor: 'White' },
  school:            { exterior: 'Bright red',    roof: 'Dark red',  trim: 'White', floor: 'Sand yellow' },
  fire_station:      { exterior: 'Bright red',    roof: 'Dark grey', trim: 'White', floor: 'Medium stone grey' },
  restaurant:        { exterior: 'Reddish brown', roof: 'Dark red',  trim: 'Bright yellow', floor: 'Sand yellow' },
  stadium:           { exterior: 'Medium stone grey', roof: 'Dark grey', trim: 'Bright blue', floor: 'Bright green' },
  office:            { exterior: 'Medium stone grey', roof: 'Dark grey', trim: 'Institutional white', floor: 'Medium stone grey' },
  default:           { exterior: 'Light grey',    roof: 'Dark grey', trim: 'White', floor: 'Medium stone grey' },
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

// Bug fix #3: expanded alias map so Groq color names don't default to Light grey
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
  const bt = buildingType.toLowerCase()
  for (const [key, theme] of Object.entries(BUILDING_COLOR_THEMES)) {
    if (key !== 'default' && bt.includes(key)) return theme
  }
  return BUILDING_COLOR_THEMES.default
}

function isRetailType(buildingType: string): boolean {
  const bt = buildingType.toLowerCase()
  return RETAIL_KEYWORDS.some(k => bt.includes(k))
}

function validateColor(color: string): string {
  if (!color) return 'Medium stone grey'
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
  return 'Medium stone grey'
}

function validateMaterial(mat: string): string {
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

// ── Room compiler ──────────────────────────────────────────────────────────

function compileRoom(
  room: ResearchResult['rooms'][0],
  offsetX: number,
  offsetZ: number,
  theme: ColorTheme,
): RbxPart[] {
  const { name, wallColor, floorColor, floorMaterial, furniture } = room
  const w = Math.max(8, Number(room.width) || 12)
  const d = Math.max(8, Number(room.depth) || 10)
  const h = Math.max(5, Number(room.height) || 10)

  // Bug fix #3: prefer research color if it resolves to something other than fallback
  const resolvedWall = validateColor(wallColor)
  const wc = (resolvedWall !== 'Medium stone grey' || !wallColor) ? resolvedWall : theme.floor
  const fc = floorColor ? validateColor(floorColor) : theme.floor
  const fm = validateMaterial(floorMaterial)
  const t = 0.5

  const parts: RbxPart[] = [
    p(`${name}_Floor`,     w, 0.5, d,   offsetX,         0.25,    offsetZ,      fc,   fm),
    p(`${name}_Ceiling`,   w, 0.5, d,   offsetX,         h,       offsetZ,      wc,   'smoothplastic'),
    p(`${name}_WallNorth`, w, h,   t,   offsetX,         h / 2,   offsetZ - d / 2, wc, 'smoothplastic'),
    p(`${name}_WallSouth`, w, h,   t,   offsetX,         h / 2,   offsetZ + d / 2, wc, 'smoothplastic'),
    p(`${name}_WallWest`,  t, h,   d,   offsetX - w / 2, h / 2,   offsetZ,      wc,   'smoothplastic'),
    p(`${name}_WallEast`,  t, h,   d,   offsetX + w / 2, h / 2,   offsetZ,      wc,   'smoothplastic'),
    // Ceiling light strip
    p(`${name}_CeilLight`, w - 1, 0.3, 1, offsetX, h - 0.2, offsetZ, 'Institutional white', 'neon', 0.1),
  ]

  // Bug fix #1: furniture Y = floor_top (0.5) + half furniture height, clamped inside room
  const margin = 1.5
  for (let fi = 0; fi < (furniture || []).length; fi++) {
    const item = furniture[fi]
    const fw = Math.max(0.5, Number(item.size?.x) || 2)
    const fh = Math.max(0.5, Number(item.size?.y) || 1)
    const fd = Math.max(0.5, Number(item.size?.z) || 2)

    const cols = Math.max(1, Math.floor((w - margin * 2) / (fw + 1)))
    const col = fi % cols
    const row = Math.floor(fi / cols)

    const rawFx = offsetX - w / 2 + margin + col * (fw + 1) + fw / 2
    const rawFz = offsetZ - d / 2 + margin + row * (fd + 1) + fd / 2
    const fx = Math.min(offsetX + w / 2 - margin, Math.max(offsetX - w / 2 + margin, rawFx))
    const fz = Math.min(offsetZ + d / 2 - margin, Math.max(offsetZ - d / 2 + margin, rawFz))

    parts.push(p(
      `${name}_${item.name}`,
      fw, fh, fd,
      fx, 0.5 + fh / 2, fz,   // Bug fix #1: correct Y
      validateColor(item.color || 'Reddish brown'),
      validateMaterial(item.material || 'wood'),
    ))
  }

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

    // Shelf unit body
    parts.push(p(`${roomName}_Shelf1_${i}`,    1, 4, shelfLength, sx,     2.5, offsetZ, 'White',      'smoothplastic'))
    // Shelf surfaces
    parts.push(p(`${roomName}_ShelfTop1_${i}`, 1, 0.3, shelfLength, sx,   4.3, offsetZ, 'Light grey', 'smoothplastic'))
    parts.push(p(`${roomName}_ShelfMid1_${i}`, 1, 0.3, shelfLength, sx,   2.3, offsetZ, 'Light grey', 'smoothplastic'))

    // Second row offset on X
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

function buildExteriorWalls(tw: number, td: number, height: number, theme: ColorTheme, buildingType: string): RbxPart[] {
  const ec = theme.exterior
  const rc = theme.roof
  const tc = theme.trim
  const retail = isRetailType(buildingType)

  const parts: RbxPart[] = [
    // Ground slab
    p('Exterior_Floor',       tw,     1,    td,     tw / 2, 0,            td / 2, 'Medium stone grey', 'concrete'),
    // Back and side solid walls
    p('Exterior_WallSouth',   tw,     height, 1,    tw / 2, height / 2,   td,     ec, 'smoothplastic'),
    p('Exterior_WallWest',    1,      height, td,   0,      height / 2,   td / 2, ec, 'smoothplastic'),
    p('Exterior_WallEast',    1,      height, td,   tw,     height / 2,   td / 2, ec, 'smoothplastic'),
    // Roof slab
    p('Exterior_Roof',        tw + 2, 1,    td + 2, tw / 2, height + 0.5, td / 2, rc, 'smoothplastic'),
    // Roof edge trim (Bug fix #5: exterior detail)
    p('Exterior_RoofTrimF',   tw + 2, 0.8,  0.8,   tw / 2, height + 0.1, -0.4,      tc, 'smoothplastic'),
    p('Exterior_RoofTrimB',   tw + 2, 0.8,  0.8,   tw / 2, height + 0.1, td + 0.4,  tc, 'smoothplastic'),
    p('Exterior_RoofTrimL',   0.8,   0.8,  td + 2, -0.4,   height + 0.1, td / 2,    tc, 'smoothplastic'),
    p('Exterior_RoofTrimR',   0.8,   0.8,  td + 2, tw + 0.4, height + 0.1, td / 2,  tc, 'smoothplastic'),
    // Corner pillars
    p('Exterior_PillarNW', 1.5, height, 1.5, 0.75,       height / 2, 0.75,       ec, 'smoothplastic'),
    p('Exterior_PillarNE', 1.5, height, 1.5, tw - 0.75,  height / 2, 0.75,       ec, 'smoothplastic'),
    p('Exterior_PillarSW', 1.5, height, 1.5, 0.75,       height / 2, td - 0.75,  ec, 'smoothplastic'),
    p('Exterior_PillarSE', 1.5, height, 1.5, tw - 0.75,  height / 2, td - 0.75,  ec, 'smoothplastic'),
  ]

  if (retail) {
    // Glass front wall: solid pillars + large glass panel + transom
    const pillarW = 2
    const glassW  = Math.max(4, tw - pillarW * 2 - 2)
    const glassH  = height - 3

    parts.push(p('Exterior_FrontPillarL', pillarW, height, 1, pillarW / 2 + 1,      height / 2, 0, ec, 'smoothplastic'))
    parts.push(p('Exterior_FrontPillarR', pillarW, height, 1, tw - pillarW / 2 - 1, height / 2, 0, ec, 'smoothplastic'))
    parts.push(p('Exterior_FrontGlass', glassW, glassH, 0.3, tw / 2, glassH / 2 + 0.5, 0, 'Institutional white', 'smoothplastic', 0.3))
    parts.push(p('Exterior_FrontTransom', tw, height - glassH - 0.5, 1, tw / 2, glassH + (height - glassH) / 2, 0, ec, 'smoothplastic'))
    // Entrance canopy
    parts.push(p('Exterior_Canopy', tw, 0.8, 4, tw / 2, height * 0.75, -2, tc, 'smoothplastic'))
    // Signage panel
    parts.push(p('Signage_Panel', Math.max(4, tw - 4), 2, 0.3, tw / 2, height - 1, -0.5, tc, 'smoothplastic'))
  } else {
    // Solid front wall with door opening implied by frame
    parts.push(p('Exterior_WallNorth',  tw, height, 1, tw / 2, height / 2, 0, ec, 'smoothplastic'))
    parts.push(p('Exterior_DoorFrameL', 0.5, 6, 1.2, tw / 2 - 2.25, 3, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorFrameR', 0.5, 6, 1.2, tw / 2 + 2.25, 3, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorHeader', 4.5, 0.5, 1.2, tw / 2, 6.25, -0.1, tc, 'smoothplastic'))
    // Entrance canopy
    parts.push(p('Exterior_Canopy', Math.min(tw, 12), 0.8, 3, tw / 2, height * 0.75, -1.5, tc, 'smoothplastic'))
    // Signage panel
    parts.push(p('Signage_Panel', Math.max(4, tw - 6), 2, 0.3, tw / 2, height - 1, -0.5, tc, 'smoothplastic'))
  }

  return parts
}

// ── Detail padding (Bug fix #5 + minimum part count) ──────────────────────

interface RoomMeta { name: string; offsetX: number; offsetZ: number; w: number; d: number; h: number }

function addDetailParts(roomData: RoomMeta[]): RbxPart[] {
  const detail: RbxPart[] = []
  for (const { name, offsetX, offsetZ, w, d, h } of roomData) {
    // Wall trim strips (top of interior walls)
    detail.push(p(`${name}_TrimN`, w,   0.4, 0.4, offsetX,         h - 0.2, offsetZ - d / 2 + 0.2, 'White', 'smoothplastic'))
    detail.push(p(`${name}_TrimS`, w,   0.4, 0.4, offsetX,         h - 0.2, offsetZ + d / 2 - 0.2, 'White', 'smoothplastic'))
    detail.push(p(`${name}_TrimW`, 0.4, 0.4, d,   offsetX - w / 2 + 0.2, h - 0.2, offsetZ, 'White', 'smoothplastic'))
    detail.push(p(`${name}_TrimE`, 0.4, 0.4, d,   offsetX + w / 2 - 0.2, h - 0.2, offsetZ, 'White', 'smoothplastic'))
    // Floor border strips
    detail.push(p(`${name}_BordN`, w,   0.3, 0.3, offsetX,         0.65, offsetZ - d / 2 + 0.15, 'Dark grey', 'smoothplastic'))
    detail.push(p(`${name}_BordS`, w,   0.3, 0.3, offsetX,         0.65, offsetZ + d / 2 - 0.15, 'Dark grey', 'smoothplastic'))
    detail.push(p(`${name}_BordW`, 0.3, 0.3, d,   offsetX - w / 2 + 0.15, 0.65, offsetZ, 'Dark grey', 'smoothplastic'))
    detail.push(p(`${name}_BordE`, 0.3, 0.3, d,   offsetX + w / 2 - 0.15, 0.65, offsetZ, 'Dark grey', 'smoothplastic'))
  }
  return detail
}

// ── Main entry point ───────────────────────────────────────────────────────

export function compileBlueprint(research: ResearchResult): CompiledBlueprint {
  const buildingType = research.buildingType || 'building'
  const theme = getColorTheme(buildingType)
  const retail = isRetailType(buildingType)

  const COLS = 2
  let cursorX = 0
  let cursorZ = 0
  let rowMaxDepth = 0
  const compiledRooms: RbxPart[][] = []
  const roomMeta: RoomMeta[] = []

  for (let i = 0; i < research.rooms.length; i++) {
    const room = research.rooms[i]
    const w = Math.max(8, Number(room.width) || 12)
    const d = Math.max(8, Number(room.depth) || 10)
    const h = Math.max(5, Number(room.height) || 10)
    const col = i % COLS

    if (col === 0 && i > 0) {
      cursorZ += rowMaxDepth + 2
      cursorX = 0
      rowMaxDepth = 0
    }

    const offsetX = cursorX + w / 2
    const offsetZ = cursorZ + d / 2

    const roomParts = compileRoom(room, offsetX, offsetZ, theme)

    // Add retail detail to the first (main sales floor) room
    if (retail && i === 0) {
      roomParts.push(...addRetailShelving(room.name, offsetX, offsetZ, w, d))
      roomParts.push(...addCheckoutCounter(room.name, offsetX, offsetZ, d))
    }

    compiledRooms.push(roomParts)
    roomMeta.push({ name: room.name, offsetX, offsetZ, w, d, h })

    cursorX += w + 2
    rowMaxDepth = Math.max(rowMaxDepth, d)
  }

  const tw = Math.max(research.totalWidth || 40, cursorX + 6)
  const td = Math.max(research.totalDepth || 30, cursorZ + rowMaxDepth + 6)
  const EXTERIOR_HEIGHT = 14

  const exterior = buildExteriorWalls(tw, td, EXTERIOR_HEIGHT, theme, buildingType)

  // Enforce minimum 40 parts
  const totalNow = compiledRooms.reduce((s, r) => s + r.length, 0) + exterior.length
  if (totalNow < 40 && compiledRooms.length > 0) {
    compiledRooms[0] = [...compiledRooms[0], ...addDetailParts(roomMeta)]
  }

  return { buildingType, rooms: compiledRooms, exterior, totalWidth: tw, totalDepth: td }
}

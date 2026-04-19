// lib/blueprint-compiler.ts
import { RbxPart } from './rbxmx'
import { ResearchResult } from './research-agent'
import { PROP_LIBRARY, getPropsForRoom } from './model-library'
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

function getDynamicTheme(research: ResearchResult): ColorTheme {
  return {
    exterior: validateColor(research.exteriorColor || 'Light grey'),
    roof: validateColor(research.roofColor || 'Dark grey'),
    trim: 'White',
    floor: validateColor(research.rooms?.[0]?.floorColor || 'Medium stone grey'),
  }
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

// ── Window builder ────────────────────────────────────────────────────────

function buildWindow(
  name: string,
  cx: number, cy: number, cz: number,
  width: number, height: number,
  direction: 'north' | 'south' | 'east' | 'west',
  style: string,
  wallColor: string,
): RbxPart[] {
  const isChinese = /chinese|japanese|asian|pagoda/.test(style)
  const thickness = 0.2
  const frameW = 0.3
  const parts: RbxPart[] = []
  const isNS = direction === 'north' || direction === 'south'
  const sx = isNS ? width : thickness
  const sz = isNS ? thickness : width

  // Glass pane
  parts.push(p(`${name}_Glass`, sx, height, sz, cx, cy, cz, 'Institutional white', 'smoothplastic', 0.35))

  // Frame sides
  const lx = isNS ? cx - width / 2 - frameW / 2 : cx
  const rx = isNS ? cx + width / 2 + frameW / 2 : cx
  const lz = isNS ? cz : cz - width / 2 - frameW / 2
  const rz = isNS ? cz : cz + width / 2 + frameW / 2
  const fsx = isNS ? frameW : thickness + 0.1
  const fsz = isNS ? thickness + 0.1 : frameW
  parts.push(p(`${name}_FrameL`, fsx, height + frameW * 2, fsz, lx, cy, lz, wallColor, 'smoothplastic'))
  parts.push(p(`${name}_FrameR`, fsx, height + frameW * 2, fsz, rx, cy, rz, wallColor, 'smoothplastic'))

  // Lintel
  const lintW = isNS ? width + frameW * 2 : thickness + 0.1
  const lintD = isNS ? thickness + 0.1 : width + frameW * 2
  parts.push(p(`${name}_Lintel`, lintW, frameW, lintD, cx, cy + height / 2 + frameW / 2, cz, wallColor, 'smoothplastic'))
  // Sill
  parts.push(p(`${name}_Sill`, lintW, frameW, lintD, cx, cy - height / 2 - frameW / 2, cz, wallColor, 'smoothplastic'))

  // Lattice bars for Chinese style
  if (isChinese) {
    const barSx = isNS ? 0.1 : thickness + 0.1
    const barSz = isNS ? thickness + 0.1 : 0.1
    for (let b = 1; b < 3; b++) {
      const bx = isNS ? cx - width / 2 + (width / 3) * b : cx
      const bz = isNS ? cz : cz - width / 2 + (width / 3) * b
      parts.push(p(`${name}_Bar${b}`, barSx, height, barSz, bx, cy, bz, wallColor, 'smoothplastic'))
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

function buildDynamicExterior(
  tw: number, td: number,
  research: ResearchResult, theme: ColorTheme,
): RbxPart[] {
  const ec = validateColor(research.exteriorColor || 'Sand yellow')
  const rc = validateColor(research.roofColor || 'Dark grey')
  const style = (research.architecturalStyle || 'modern').toLowerCase()
  const extMat = validateMaterial(research.exteriorMaterial || 'smoothplastic')
  const tc = theme.trim
  const hasGlassFront = research.hasGlassFront
  const hasColonnade = research.hasColonnade
  const floorCount = Math.max(1, Number(research.floorCount) || 1)
  const floorHeight = Math.max(8, Number(research.floorHeight) || 10)
  const height = floorCount * floorHeight
  const isChinese = /chinese|japanese|asian|pagoda/.test(style)
  const isColonial = /colonial|georgian|federal|mediterranean/.test(style)
  console.log('[exterior] ec:', ec, 'rc:', rc, 'style:', style, 'extMat:', extMat, 'floors:', floorCount)

  const parts: RbxPart[] = [
    // Ground slab
    p('Exterior_Ground',    tw + 30, 1, td + 30, tw / 2,  0,           td / 2,    'Medium stone grey', 'concrete'),
    // Perimeter walls
    p('Exterior_WallSouth', tw, height, 1, tw / 2, height / 2, td,     ec, extMat),
    p('Exterior_WallWest',  1, height, td, 0,      height / 2, td / 2,  ec, extMat),
    p('Exterior_WallEast',  1, height, td, tw,     height / 2, td / 2,  ec, extMat),
    // Corner pillars
    p('Exterior_PillarNW', 1.5, height, 1.5, 0.75,      height / 2, 0.75,      ec, extMat),
    p('Exterior_PillarNE', 1.5, height, 1.5, tw - 0.75, height / 2, 0.75,      ec, extMat),
    p('Exterior_PillarSW', 1.5, height, 1.5, 0.75,      height / 2, td - 0.75, ec, extMat),
    p('Exterior_PillarSE', 1.5, height, 1.5, tw - 0.75, height / 2, td - 0.75, ec, extMat),
  ]

  // ── Per-floor horizontal banding on east/west/south ───────────────────────
  for (let fl = 1; fl < floorCount; fl++) {
    const bandY = fl * floorHeight
    parts.push(p(`Band_S_F${fl}`, tw, 0.4, 0.8, tw / 2, bandY, td, tc, 'smoothplastic'))
    parts.push(p(`Band_W_F${fl}`, 0.8, 0.4, td, 0,      bandY, td / 2, tc, 'smoothplastic'))
    parts.push(p(`Band_E_F${fl}`, 0.8, 0.4, td, tw,     bandY, td / 2, tc, 'smoothplastic'))
  }

  // ── Per-floor windows on south / east / west walls ────────────────────────
  const winW = 2.5
  const winH = Math.min(floorHeight - 3, 4)
  const winCountS = Math.max(1, Math.floor((tw - 6) / 8))
  const winCountE = Math.max(1, Math.floor((td - 6) / 8))
  for (let fl = 0; fl < floorCount; fl++) {
    const winY = fl * floorHeight + floorHeight * 0.55
    for (let wi = 0; wi < winCountS; wi++) {
      const wx = 4 + wi * 8
      if (wx > tw - 4) break
      parts.push(...buildWindow(`Win_S_F${fl}_${wi}`, wx, winY, td, winW, winH, 'south', style, ec))
    }
    for (let wi = 0; wi < winCountE; wi++) {
      const wz = 4 + wi * 8
      if (wz > td - 4) break
      parts.push(...buildWindow(`Win_E_F${fl}_${wi}`, tw, winY, wz, winW, winH, 'east', style, ec))
      parts.push(...buildWindow(`Win_W_F${fl}_${wi}`, 0,  winY, wz, winW, winH, 'west', style, ec))
    }
  }

  // ── Chinese / Pagoda roof tiers ───────────────────────────────────────────
  if (isChinese) {
    const tierCount = Math.min(floorCount + 1, 4)
    for (let t = 0; t < tierCount; t++) {
      const tierW = tw + 4 - t * 3
      const tierD = td + 4 - t * 3
      const tierY = height + t * 3
      parts.push(p(`Roof_Tier${t}`,      tierW,     1,   tierD,     tw / 2, tierY,         td / 2, rc, 'smoothplastic'))
      parts.push(p(`Roof_EaveF_T${t}`,   tierW + 2, 0.4, 2,         tw / 2, tierY - 0.5,  -1,     rc, 'smoothplastic'))
      parts.push(p(`Roof_EaveB_T${t}`,   tierW + 2, 0.4, 2,         tw / 2, tierY - 0.5,  td + 1, rc, 'smoothplastic'))
      parts.push(p(`Roof_EaveL_T${t}`,   2,         0.4, tierD + 2, -1,     tierY - 0.5,  td / 2, rc, 'smoothplastic'))
      parts.push(p(`Roof_EaveR_T${t}`,   2,         0.4, tierD + 2, tw + 1, tierY - 0.5,  td / 2, rc, 'smoothplastic'))
    }
    // Roof finial
    parts.push(p('Roof_Finial', 0.8, 3, 0.8, tw / 2, height + tierCount * 3 + 1.5, td / 2, rc, 'smoothplastic'))
  } else {
    // Standard flat roof + HVAC
    parts.push(p('Exterior_Roof', tw + 2, 1, td + 2, tw / 2, height + 0.5, td / 2, rc, 'smoothplastic'))
    parts.push(p('Exterior_RoofTrimF', tw + 2, 0.8, 0.8, tw / 2,     height + 0.1, -0.4,     tc, 'smoothplastic'))
    parts.push(p('Exterior_RoofTrimB', tw + 2, 0.8, 0.8, tw / 2,     height + 0.1, td + 0.4, tc, 'smoothplastic'))
    parts.push(p('Exterior_RoofTrimL', 0.8,   0.8, td + 2, -0.4,    height + 0.1, td / 2,   tc, 'smoothplastic'))
    parts.push(p('Exterior_RoofTrimR', 0.8,   0.8, td + 2, tw + 0.4, height + 0.1, td / 2,  tc, 'smoothplastic'))
    const hvacCount = Math.max(1, Math.floor(tw / 20))
    for (let i = 0; i < hvacCount; i++) {
      const hx = tw * 0.25 + i * (tw / (hvacCount + 1))
      parts.push(p(`Roof_HVAC_${i}`,     4, 2,   3, hx, height + 1.5,  td / 2 + i * 4, 'Dark grey', 'metal'))
      parts.push(p(`Roof_HVAC_Fan_${i}`, 3, 0.3, 3, hx, height + 2.65, td / 2 + i * 4, 'Medium stone grey', 'metal'))
    }
  }

  // ── Colonial colonnade (ground floor arches / columns) ───────────────────
  if (isColonial || hasColonnade) {
    const colSpacing = 6
    const colCount = Math.max(2, Math.floor((tw - 4) / colSpacing))
    for (let i = 0; i < colCount; i++) {
      const cx = 3 + i * colSpacing
      if (cx > tw - 3) break
      parts.push(p(`Colonnade_Col_${i}`, 1.2, floorHeight, 1.2, cx, floorHeight / 2, -1.5, 'White', 'smoothplastic'))
      // Arch between columns
      if (i < colCount - 1) {
        const archX = cx + colSpacing / 2
        parts.push(p(`Colonnade_Arch_${i}`, colSpacing - 1, 1, 2, archX, floorHeight - 1, -1.5, 'White', 'smoothplastic'))
      }
    }
    // Balcony slab above colonnade
    parts.push(p('Colonnade_Balcony', tw, 0.6, 3, tw / 2, floorHeight, -1.5, tc, 'concrete'))
  }

  // ── Bollards near entrance ─────────────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const bx = tw / 2 - 6 + i * 4
    parts.push(p(`Bollard_${i}_Post`, 0.6, 3, 0.6, bx, 1.5, -3, 'Dark grey', 'metal'))
    parts.push(p(`Bollard_${i}_Top`,  0.8, 0.4, 0.8, bx, 3.2, -3, 'Bright yellow', 'smoothplastic'))
  }

  // ── Lamp posts ─────────────────────────────────────────────────────────────
  parts.push(p('LampPost_L_Pole',  0.4, 8, 0.4, tw / 2 - 8, 4, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_L_Head',  1.5, 0.5, 1.5, tw / 2 - 8, 8.25, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_L_Light', 1, 0.3, 1, tw / 2 - 8, 8, -6, 'Bright yellow', 'neon', 0.1))
  parts.push(p('LampPost_R_Pole',  0.4, 8, 0.4, tw / 2 + 8, 4, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_R_Head',  1.5, 0.5, 1.5, tw / 2 + 8, 8.25, -6, 'Dark grey', 'metal'))
  parts.push(p('LampPost_R_Light', 1, 0.3, 1, tw / 2 + 8, 8, -6, 'Bright yellow', 'neon', 0.1))

  // ── Flagpole ───────────────────────────────────────────────────────────────
  parts.push(p('Flagpole_Base', 1, 0.5, 1, tw / 2 - tw / 3, 0.25, -8, 'Medium stone grey', 'concrete'))
  parts.push(p('Flagpole_Pole', 0.3, 14, 0.3, tw / 2 - tw / 3, 7, -8, 'Light grey', 'metal'))
  parts.push(p('Flagpole_Flag', 4, 2.5, 0.2, tw / 2 - tw / 3 + 2, 13, -8, 'Bright red', 'fabric'))

  // ── Front wall + entrance ──────────────────────────────────────────────────
  if (hasGlassFront) {
    const pillarW = 2
    const glassW = Math.max(4, tw - pillarW * 2 - 2)
    const glassH = height - 3
    parts.push(p('Exterior_FrontPillarL', pillarW, height, 1, pillarW / 2 + 1,      height / 2, 0, ec, extMat))
    parts.push(p('Exterior_FrontPillarR', pillarW, height, 1, tw - pillarW / 2 - 1, height / 2, 0, ec, extMat))
    parts.push(p('Exterior_FrontGlass',   glassW, glassH, 0.3, tw / 2, glassH / 2 + 0.5, 0, 'Institutional white', 'smoothplastic', 0.3))
    parts.push(p('Exterior_FrontTransom', tw, height - glassH - 0.5, 1, tw / 2, glassH + (height - glassH) / 2, 0, ec, extMat))
    parts.push(p('Exterior_Canopy',       tw, 0.8, 4, tw / 2, height * 0.75, -2, tc, 'smoothplastic'))
    parts.push(p('Signage_Panel',         Math.max(4, tw - 4), 2.5, 0.3, tw / 2, height - 1, -0.5, ec, 'neon'))
  } else {
    parts.push(p('Exterior_WallNorth',  tw, height, 1, tw / 2, height / 2, 0, ec, extMat))
    parts.push(p('Exterior_DoorFrameL', 0.5, 6, 1.2, tw / 2 - 2.25, 3, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorFrameR', 0.5, 6, 1.2, tw / 2 + 2.25, 3, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorHeader', 4.5, 0.5, 1.2, tw / 2, 6.25, -0.1, tc, 'smoothplastic'))
    parts.push(p('Exterior_DoorGlass',  3.5, 5, 0.2, tw / 2, 3, -0.1, 'Institutional white', 'smoothplastic', 0.5))
    // Per-floor windows on north facade (skipping entrance bay)
    for (let fl = 0; fl < floorCount; fl++) {
      const winY = fl * floorHeight + floorHeight * 0.55
      for (let wi = 0; wi < winCountS; wi++) {
        const wx = 4 + wi * 8
        if (wx > tw - 4) break
        if (fl === 0 && Math.abs(wx - tw / 2) < 4) continue  // skip entrance bay ground floor
        parts.push(...buildWindow(`Win_N_F${fl}_${wi}`, wx, winY, 0, winW, winH, 'north', style, ec))
      }
    }
    parts.push(p('Exterior_Canopy',  Math.min(tw, 12), 0.8, 3, tw / 2, height * 0.75, -1.5, tc, 'smoothplastic'))
    parts.push(p('Signage_Panel',    Math.max(4, tw - 6), 2.5, 0.3, tw / 2, height - 1, -0.5, ec, 'neon'))
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

// ── Prop library placement — see model-library.ts for getPropsForRoom ──────

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

// ── Exterior-only extra detail ─────────────────────────────────────────────

function buildDetailedExteriorOnly(tw: number, td: number, height: number, theme: ColorTheme): RbxPart[] {
  const parts: RbxPart[] = []
  const ec = theme.exterior
  const pipeH = height + 3

  // GROUND DETAIL
  parts.push(p('EO_GroundExt',  tw + 40, 0.5, td + 40, tw / 2, 0.25,  td / 2, 'Medium stone grey', 'concrete'))
  parts.push(p('EO_Pavement',   tw + 6,  0.6, 8,       tw / 2, 0.3,  -4,      'Light grey',        'concrete'))
  parts.push(p('EO_KerbLeft',   0.5,     0.8, 8,       -0.25,  0.4,  -4,      'White',             'concrete'))
  parts.push(p('EO_KerbRight',  0.5,     0.8, 8,       tw + 0.25, 0.4, -4,    'White',             'concrete'))
  parts.push(p('EO_Road',       tw + 40, 0.4, 12,      tw / 2, 0.2,  -14,     'Dark grey',         'concrete'))
  parts.push(p('EO_RoadLineC',  tw + 40, 0.5, 0.2,     tw / 2, 0.45, -14,     'White',             'smoothplastic'))
  parts.push(p('EO_RoadLineY',  tw + 40, 0.5, 0.2,     tw / 2, 0.45, -12,     'Bright yellow',     'smoothplastic'))

  // CAR PARK (right side of building)
  const cpX = tw + 15
  const cpZ = td / 2
  const cpD = td + 10
  parts.push(p('EO_CarParkSurf',  30, 0.6, cpD, cpX, 0.3,  cpZ,          'Dark grey',  'concrete'))
  parts.push(p('EO_CarParkKerb',  30, 0.8, 0.4, cpX, 0.4,  cpZ - cpD / 2, 'White',     'concrete'))
  parts.push(p('EO_DisabledBay',   4, 0.6, 6,   tw + 4, 0.35, cpZ,       'Bright blue', 'smoothplastic'))
  for (let i = 0; i < 8; i++) {
    parts.push(p(`EO_BayLine_${i}`, 0.2, 0.6, 6, tw + 4 + i * 3.2, 0.35, cpZ, 'White', 'smoothplastic'))
  }

  // ENTRANCE DETAIL
  const gL = tw / 2 - 5
  const gR = tw / 2 + 5
  parts.push(p('EO_GatePostL',  1,   6,   1,   gL,       3,     -2.5, 'Dark grey', 'metal'))
  parts.push(p('EO_GatePostR',  1,   6,   1,   gR,       3,     -2.5, 'Dark grey', 'metal'))
  parts.push(p('EO_GateCapL',   1.2, 0.5, 1.2, gL,       6.25,  -2.5, 'Dark grey', 'metal'))
  parts.push(p('EO_GateCapR',   1.2, 0.5, 1.2, gR,       6.25,  -2.5, 'Dark grey', 'metal'))
  parts.push(p('EO_WelcomeMat', 4,   0.6, 2,   tw / 2,   0.3,   -1,   'Dark grey', 'concrete'))
  parts.push(p('EO_Step1',      tw / 3, 0.4, 1, tw / 2,  0.7,   -0.5, 'Medium stone grey', 'concrete'))
  parts.push(p('EO_Step2',      tw / 3, 0.4, 1, tw / 2,  1.1,    0.5, 'Medium stone grey', 'concrete'))

  // ROOF DETAIL
  parts.push(p('EO_ParapetF',  tw + 2, 1.5, 0.6, tw / 2,    height + 1.25, -0.3,      ec, 'smoothplastic'))
  parts.push(p('EO_ParapetB',  tw + 2, 1.5, 0.6, tw / 2,    height + 1.25, td + 0.3,  ec, 'smoothplastic'))
  parts.push(p('EO_ParapetL',  0.6, 1.5, td + 2, -0.3,      height + 1.25, td / 2,    ec, 'smoothplastic'))
  parts.push(p('EO_ParapetR',  0.6, 1.5, td + 2, tw + 0.3,  height + 1.25, td / 2,    ec, 'smoothplastic'))
  parts.push(p('EO_RoofAC1',  4, 2, 4, tw / 4,     height + 1.5, td / 2, 'Dark grey', 'metal'))
  parts.push(p('EO_RoofAC2',  4, 2, 4, tw * 3 / 4, height + 1.5, td / 2, 'Dark grey', 'metal'))
  parts.push(p('EO_Satellite', 2, 1, 2, tw / 2,     height + 1,   td / 4, 'Medium stone grey', 'metal'))
  parts.push(p('EO_WaterTank', 3, 3, 3, tw * 3 / 4, height + 2,   td * 3 / 4, 'Medium stone grey', 'metal'))
  parts.push(p('EO_DrainNW',  0.4, pipeH, 0.4, 0.2,      pipeH / 2, 0.2,       'Dark grey', 'metal'))
  parts.push(p('EO_DrainNE',  0.4, pipeH, 0.4, tw - 0.2, pipeH / 2, 0.2,       'Dark grey', 'metal'))
  parts.push(p('EO_DrainSW',  0.4, pipeH, 0.4, 0.2,      pipeH / 2, td - 0.2,  'Dark grey', 'metal'))
  parts.push(p('EO_DrainSE',  0.4, pipeH, 0.4, tw - 0.2, pipeH / 2, td - 0.2,  'Dark grey', 'metal'))

  // WALL SURFACE DETAIL
  const winW = 3
  const winCount = Math.max(1, Math.floor((tw - 6) / 8))
  for (let i = 0; i < winCount; i++) {
    const wx = 4 + i * 8
    parts.push(p(`EO_WinLedgeF_${i}`, winW + 0.4, 0.15, 0.3, wx, 4, -0.15,     'White', 'smoothplastic'))
    parts.push(p(`EO_WinLintF_${i}`,  winW + 0.4, 0.15, 0.3, wx, 7, -0.15,     'White', 'smoothplastic'))
    parts.push(p(`EO_WinLedgeB_${i}`, winW + 0.4, 0.15, 0.3, wx, 4, td + 0.15, 'White', 'smoothplastic'))
    parts.push(p(`EO_WinLintB_${i}`,  winW + 0.4, 0.15, 0.3, wx, 7, td + 0.15, 'White', 'smoothplastic'))
  }
  const courseCount = Math.floor(height / 2)
  for (let i = 1; i < courseCount; i++) {
    parts.push(p(`EO_CourseN_${i}`, tw, 0.05, 0.05, tw / 2, i * 2, -0.01, 'Medium stone grey', 'smoothplastic'))
  }
  const quoinMax = Math.min(8, Math.floor(height / 1.2))
  for (let i = 0; i < quoinMax; i++) {
    const qy = 0.5 + i * 1.2
    const wide = i % 2 === 0
    parts.push(p(`EO_QuoinNW_${i}`, wide ? 1 : 0.4, 0.4, wide ? 0.4 : 1, 0,  qy + 0.2, 0, 'White', 'smoothplastic'))
    parts.push(p(`EO_QuoinNE_${i}`, wide ? 1 : 0.4, 0.4, wide ? 0.4 : 1, tw, qy + 0.2, 0, 'White', 'smoothplastic'))
  }

  // EXTERIOR LIGHTING
  parts.push(p('EO_FloodNW', 0.8, 0.4, 0.8, 2,      0.2, 2,      'Institutional white', 'neon', 0.1))
  parts.push(p('EO_FloodNE', 0.8, 0.4, 0.8, tw - 2, 0.2, 2,      'Institutional white', 'neon', 0.1))
  parts.push(p('EO_FloodSW', 0.8, 0.4, 0.8, 2,      0.2, td - 2, 'Institutional white', 'neon', 0.1))
  parts.push(p('EO_FloodSE', 0.8, 0.4, 0.8, tw - 2, 0.2, td - 2, 'Institutional white', 'neon', 0.1))
  const lampPx = [tw / 2 - tw / 3, tw / 2 - tw / 5, tw / 2 + tw / 5, tw / 2 + tw / 3]
  for (let i = 0; i < 4; i++) {
    const lx = lampPx[i]
    parts.push(p(`EO_LampPole_${i}`, 0.4, 12, 0.4, lx,  6,    -8,    'Dark grey',          'metal'))
    parts.push(p(`EO_LampArm_${i}`,  0.2, 0.2, 1.5, lx, 12.1, -8.75, 'Dark grey',          'metal'))
    parts.push(p(`EO_LampHead_${i}`, 1,   0.5, 1,   lx, 12,   -9.5,  'Institutional white', 'neon', 0.1))
  }

  // SIGNAGE
  parts.push(p('EO_Fascia',       tw - 2, 3,   0.5, tw / 2, height - 1.5, -0.25, ec, 'smoothplastic'))
  parts.push(p('EO_FasciaLightB', tw - 2, 0.2, 0.2, tw / 2, height - 3,   -0.1,  'Institutional white', 'neon', 0.1))
  parts.push(p('EO_FasciaLightT', tw - 2, 0.2, 0.2, tw / 2, height,       -0.1,  'Institutional white', 'neon', 0.1))
  parts.push(p('EO_SideSignL',    0.3, 2, 2, -0.15,     height - 3, td / 2, ec, 'smoothplastic'))
  parts.push(p('EO_SideSignR',    0.3, 2, 2,  tw + 0.15, height - 3, td / 2, ec, 'smoothplastic'))

  return parts
}

// ── Main entry point ───────────────────────────────────────────────────────

export function compileBlueprint(research: ResearchResult): CompiledBlueprint {
  const buildingType = research.buildingType || 'building'
  const theme = getDynamicTheme(research)

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

    if (research.hasGlassFront && i === 0) {
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
  const floorCount = Math.max(1, Number(research.floorCount) || 1)
  const floorHeight = Math.max(8, Number(research.floorHeight) || 10)
  const totalHeight = floorCount * floorHeight
  const tallestRoom = Math.max(...research.rooms.map(r => Math.max(5, Number(r.height) || 10)))
  const EXTERIOR_HEIGHT = Math.max(tallestRoom + 2, totalHeight)
  console.log('[blueprint-compiler] floorCount:', floorCount, 'totalHeight:', totalHeight)
  console.log('[blueprint-compiler] architecturalStyle:', research.architecturalStyle)
  console.log('[blueprint-compiler] exteriorColor:', research.exteriorColor)
  console.log('[compileBlueprint] building exterior with research:', research.buildingType, 'floorCount:', research.floorCount, 'style:', research.architecturalStyle)

  const exterior = buildDynamicExterior(tw, td, research, theme)
  exterior.push(...buildDetailedExteriorOnly(tw, td, EXTERIOR_HEIGHT, theme))

  const totalNow = compiledRooms.reduce((s, r) => s + r.length, 0) + exterior.length
  if (totalNow < 40 && compiledRooms.length > 0) {
    compiledRooms[0] = [...compiledRooms[0], ...addDetailParts(roomMeta)]
  }

  return { buildingType, rooms: compiledRooms, exterior, totalWidth: tw, totalDepth: td, roomLayout }
}

// lib/detail-system.ts
import { RbxPart } from './rbxmx'

export interface DetailedPart extends RbxPart {
  layer: 'structure' | 'detail' | 'trim' | 'prop' | 'accent'
}

function dp(
  name: string,
  sx: number, sy: number, sz: number,
  px: number, py: number, pz: number,
  color: string, mat: string,
  layer: DetailedPart['layer'],
  transparency = 0,
  emissive = false,
): DetailedPart {
  return {
    name, size: { x: sx, y: sy, z: sz }, position: { x: px, y: py, z: pz },
    color, material: mat, anchored: true, transparency,
    emissive: emissive || undefined, layer,
  }
}

// ── Walls ──────────────────────────────────────────────────────────────────

export function buildDetailedWall(params: {
  name: string; x: number; y: number; z: number
  width: number; height: number
  direction: 'north' | 'south' | 'east' | 'west'
  color: string; material: string
  hasWindow?: boolean; windowCount?: number
  hasSkirtingBoard?: boolean; hasCornicing?: boolean
}): DetailedPart[] {
  const { name, x, y, z, width, height, direction, color, material,
    hasWindow, windowCount = 1, hasSkirtingBoard, hasCornicing } = params
  const parts: DetailedPart[] = []
  const isNS = direction === 'north' || direction === 'south'
  const wallSx = isNS ? width : 0.3
  const wallSz = isNS ? 0.3 : width

  parts.push(dp(`${name}_Body`, wallSx, height, wallSz, x, y + height / 2, z, color, material, 'structure'))

  if (hasSkirtingBoard) {
    const skSx = isNS ? width : 0.42
    const skSz = isNS ? 0.42 : width
    parts.push(dp(`${name}_Skirting`, skSx, 0.8, skSz, x, y + 0.4, z, 'White', 'smoothplastic', 'trim'))
  }

  if (hasCornicing) {
    const coSx = isNS ? width : 0.42
    const coSz = isNS ? 0.42 : width
    parts.push(dp(`${name}_Cornicing`, coSx, 0.4, coSz, x, y + height - 0.2, z, 'White', 'smoothplastic', 'trim'))
  }

  if (hasWindow && windowCount > 0) {
    const winW = 2.5
    const winH = 2.5
    const winY = y + height * 0.55
    const spacing = width / (windowCount + 1)
    const zPad = direction === 'north' ? 0.05 : direction === 'south' ? -0.05 : 0
    const xPad = direction === 'east' ? -0.05 : direction === 'west' ? 0.05 : 0

    for (let i = 0; i < windowCount; i++) {
      const offset = -width / 2 + spacing * (i + 1)
      const wx = isNS ? x + offset : x
      const wz = isNS ? z : z + offset
      const tag = `${name}_Win${i}`

      // Frame top / bottom
      parts.push(dp(`${tag}_FrameT`, isNS ? winW + 0.4 : 0.2, 0.2, isNS ? 0.2 : winW + 0.4, wx + xPad, winY + winH / 2 + 0.1, wz + zPad, 'White', 'smoothplastic', 'detail'))
      parts.push(dp(`${tag}_FrameB`, isNS ? winW + 0.4 : 0.2, 0.2, isNS ? 0.2 : winW + 0.4, wx + xPad, winY - winH / 2 - 0.1, wz + zPad, 'White', 'smoothplastic', 'detail'))
      // Frame sides
      const lOff = isNS ? { x: -winW / 2 - 0.2, z: zPad } : { x: xPad, z: -winW / 2 - 0.2 }
      const rOff = isNS ? { x:  winW / 2 + 0.2, z: zPad } : { x: xPad, z:  winW / 2 + 0.2 }
      parts.push(dp(`${tag}_FrameL`, isNS ? 0.2 : 0.2, winH + 0.2, isNS ? 0.2 : winW + 0.4, wx + lOff.x, winY, wz + lOff.z, 'White', 'smoothplastic', 'detail'))
      parts.push(dp(`${tag}_FrameR`, isNS ? 0.2 : 0.2, winH + 0.2, isNS ? 0.2 : winW + 0.4, wx + rOff.x, winY, wz + rOff.z, 'White', 'smoothplastic', 'detail'))
      // Glass
      parts.push(dp(`${tag}_Glass`, isNS ? winW : 0.15, winH, isNS ? 0.15 : winW, wx + xPad, winY, wz + zPad, 'Institutional white', 'smoothplastic', 'detail', 0.4))
      // Sill
      const sillZOff = direction === 'north' ? -0.3 : direction === 'south' ? 0.3 : 0
      parts.push(dp(`${tag}_Sill`, isNS ? winW + 0.4 : 0.4, 0.1, isNS ? 0.4 : winW + 0.4, wx, winY - winH / 2 - 0.15, wz + sillZOff, 'White', 'smoothplastic', 'detail'))
    }
  }

  return parts
}

// ── Floor ──────────────────────────────────────────────────────────────────

export function buildDetailedFloor(params: {
  name: string; x: number; z: number
  width: number; depth: number
  color: string; material: string
  hasBorderTiles?: boolean
}): DetailedPart[] {
  const { name, x, z, width, depth, color, material, hasBorderTiles } = params
  const parts: DetailedPart[] = []

  parts.push(dp(`${name}_Floor`, width, 1, depth, x, 0.5, z, color, material, 'structure'))

  if (hasBorderTiles) {
    const bc = color === 'White' ? 'Light grey' : 'White'
    const bw = 0.5
    parts.push(dp(`${name}_BorderN`, width, 0.05, bw, x, 1.03, z - depth / 2 + bw / 2, bc, 'smoothplastic', 'trim'))
    parts.push(dp(`${name}_BorderS`, width, 0.05, bw, x, 1.03, z + depth / 2 - bw / 2, bc, 'smoothplastic', 'trim'))
    parts.push(dp(`${name}_BorderW`, bw, 0.05, depth, x - width / 2 + bw / 2, 1.03, z, bc, 'smoothplastic', 'trim'))
    parts.push(dp(`${name}_BorderE`, bw, 0.05, depth, x + width / 2 - bw / 2, 1.03, z, bc, 'smoothplastic', 'trim'))
  }

  return parts
}

// ── Ceiling ────────────────────────────────────────────────────────────────

export function buildDetailedCeiling(params: {
  name: string; x: number; z: number
  width: number; depth: number; height: number
  color: string
  lightCount?: number; hasAirVents?: boolean
}): DetailedPart[] {
  const { name, x, z, width, depth, height, color, lightCount = 2, hasAirVents } = params
  const parts: DetailedPart[] = []

  parts.push(dp(`${name}_Ceiling`, width, 0.4, depth, x, height - 0.2, z, color, 'smoothplastic', 'structure'))

  const cols = Math.max(1, Math.ceil(Math.sqrt(lightCount)))
  const rows = Math.ceil(lightCount / cols)
  const spX = width / (cols + 1)
  const spZ = depth / (rows + 1)

  for (let li = 0; li < lightCount; li++) {
    const col = li % cols
    const row = Math.floor(li / cols)
    const lx = x - width / 2 + spX * (col + 1)
    const lz = z - depth / 2 + spZ * (row + 1)
    const ly = height - 0.42
    parts.push(dp(`${name}_LightSurround${li}`, 3.4, 1.4, 0.12, lx, ly + 0.06, lz, 'White', 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_LightPanel${li}`, 3, 1, 0.2, lx, ly - 0.05, lz, 'Institutional white', 'neon', 'accent', 0, true))
  }

  if (hasAirVents) {
    const vc = Math.max(1, Math.floor(width / 8))
    for (let vi = 0; vi < vc; vi++) {
      const vx = x - width / 2 + (width / (vc + 1)) * (vi + 1)
      parts.push(dp(`${name}_Vent${vi}`, 2, 1, 0.1, vx, height - 0.46, z - depth / 2 + 2, 'Light grey', 'metal', 'detail'))
    }
  }

  return parts
}

// ── Door ──────────────────────────────────────────────────────────────────

export function buildDetailedDoor(params: {
  name: string; x: number; y: number; z: number
  width?: number; height?: number
  direction: 'north' | 'south' | 'east' | 'west'
  frameColor?: string; doorColor?: string
}): DetailedPart[] {
  const { name, x, y, z, width = 3, height = 7, direction,
    frameColor = 'White', doorColor = 'Reddish brown' } = params
  const parts: DetailedPart[] = []
  const isNS = direction === 'north' || direction === 'south'
  const panelOff = direction === 'north' ? 0.05 : direction === 'south' ? -0.05 : direction === 'east' ? -0.05 : 0.05

  if (isNS) {
    parts.push(dp(`${name}_FrameL`, 0.2, height + 0.2, 0.3, x - width / 2 - 0.1, y + height / 2, z, frameColor, 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_FrameR`, 0.2, height + 0.2, 0.3, x + width / 2 + 0.1, y + height / 2, z, frameColor, 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_FrameTop`, width + 0.4, 0.2, 0.3, x, y + height + 0.1, z, frameColor, 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_Door`, width - 0.2, height - 0.2, 0.15, x, y + (height - 0.2) / 2 + 0.1, z + panelOff, doorColor, 'wood', 'prop'))
  } else {
    parts.push(dp(`${name}_FrameL`, 0.3, height + 0.2, 0.2, x, y + height / 2, z - width / 2 - 0.1, frameColor, 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_FrameR`, 0.3, height + 0.2, 0.2, x, y + height / 2, z + width / 2 + 0.1, frameColor, 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_FrameTop`, 0.3, 0.2, width + 0.4, x, y + height + 0.1, z, frameColor, 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_Door`, 0.15, height - 0.2, width - 0.2, x + panelOff, y + (height - 0.2) / 2 + 0.1, z, doorColor, 'wood', 'prop'))
  }

  // Handle
  const hx = isNS ? x + width / 4 : x + panelOff * 2
  const hz = isNS ? z + panelOff * 2 : z + width / 4
  parts.push(dp(`${name}_Handle`, 0.15, 0.15, 0.4, hx, y + height * 0.45, hz, 'Medium stone grey', 'metal', 'detail'))
  // Number plate
  const npx = isNS ? x - width / 4 : x + panelOff * 2
  const npz = isNS ? z + panelOff * 2 : z - width / 4
  parts.push(dp(`${name}_Plate`, isNS ? 0.8 : 0.1, 0.4, isNS ? 0.1 : 0.8, npx, y + height * 0.55, npz, 'Dark grey', 'smoothplastic', 'detail'))

  return parts
}

// ── Desk ──────────────────────────────────────────────────────────────────

export function buildDetailedDesk(params: {
  name: string; x: number; y: number; z: number
  width?: number; depth?: number
  deskColor?: string; legColor?: string
}): DetailedPart[] {
  const { name, x, y, z, width = 4, depth = 2, deskColor = 'Reddish brown', legColor = 'Dark grey' } = params
  const f = y + 1
  const top = f + 2.15
  const parts: DetailedPart[] = []

  parts.push(dp(`${name}_Surface`, width, 0.25, depth, x, top, z, deskColor, 'wood', 'prop'))
  parts.push(dp(`${name}_Modesty`, width - 0.4, 2, 0.1, x, f + 1.15, z + depth / 2 - 0.05, deskColor, 'wood', 'detail'))
  parts.push(dp(`${name}_LegFL`, 0.2, 2, 0.2, x - width / 2 + 0.2, f + 1, z - depth / 2 + 0.2, legColor, 'metal', 'detail'))
  parts.push(dp(`${name}_LegFR`, 0.2, 2, 0.2, x + width / 2 - 0.2, f + 1, z - depth / 2 + 0.2, legColor, 'metal', 'detail'))
  parts.push(dp(`${name}_LegBL`, 0.2, 2, 0.2, x - width / 2 + 0.2, f + 1, z + depth / 2 - 0.2, legColor, 'metal', 'detail'))
  parts.push(dp(`${name}_LegBR`, 0.2, 2, 0.2, x + width / 2 - 0.2, f + 1, z + depth / 2 - 0.2, legColor, 'metal', 'detail'))
  parts.push(dp(`${name}_CableTray`, width - 1, 0.1, 0.4, x, top - 0.25, z + depth / 2 - 0.3, 'Dark grey', 'metal', 'detail'))
  parts.push(dp(`${name}_MonitorBase`, 0.8, 0.1, 0.8, x - width / 4, top + 0.05, z - depth / 4, 'Dark grey', 'smoothplastic', 'prop'))
  parts.push(dp(`${name}_MonitorNeck`, 0.15, 1, 0.15, x - width / 4, top + 0.55, z - depth / 4, 'Dark grey', 'smoothplastic', 'prop'))
  parts.push(dp(`${name}_MonitorBezel`, 2.7, 1.8, 0.08, x - width / 4, top + 1.7, z - depth / 4, 'Dark grey', 'smoothplastic', 'prop'))
  parts.push(dp(`${name}_MonitorScreen`, 2.5, 1.6, 0.1, x - width / 4, top + 1.7, z - depth / 4 + 0.05, 'Black', 'smoothplastic', 'prop', 0.05))
  parts.push(dp(`${name}_Keyboard`, 1.8, 0.1, 0.7, x, top + 0.1, z - depth / 4 + 0.3, 'Light grey', 'smoothplastic', 'prop'))
  parts.push(dp(`${name}_Mouse`, 0.4, 0.1, 0.6, x + width / 4, top + 0.1, z - depth / 4 + 0.3, 'Light grey', 'smoothplastic', 'prop'))
  parts.push(dp(`${name}_Mousepad`, 0.8, 0.05, 0.7, x + width / 4, top + 0.05, z - depth / 4 + 0.3, 'Black', 'fabric', 'prop'))

  return parts
}

// ── Chair ──────────────────────────────────────────────────────────────────

export function buildDetailedChair(params: {
  name: string; x: number; y: number; z: number
  color?: string
  style?: 'office' | 'dining' | 'waiting' | 'metal'
}): DetailedPart[] {
  const { name, x, y, z, color = 'Dark grey', style = 'office' } = params
  const f = y + 1
  const parts: DetailedPart[] = []

  if (style === 'dining' || style === 'waiting') {
    parts.push(dp(`${name}_Seat`, 2, 0.3, 2, x, f + 1.8, z, color, 'fabric', 'prop'))
    parts.push(dp(`${name}_Shell`, 2.1, 0.2, 2.1, x, f + 1.6, z, 'Dark grey', 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_Back`, 2, 2, 0.25, x, f + 3, z - 1, color, 'fabric', 'prop'))
    parts.push(dp(`${name}_BackShell`, 2.1, 2.1, 0.15, x, f + 3, z - 1, 'Dark grey', 'smoothplastic', 'detail'))
    for (const [dx, dz] of [[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]]) {
      parts.push(dp(`${name}_Leg_${dx}_${dz}`, 0.2, 2, 0.2, x + dx, f + 0.9, z + dz, 'Medium stone grey', 'metal', 'detail'))
    }
    return parts
  }

  if (style === 'metal') {
    parts.push(dp(`${name}_Seat`, 2, 0.3, 2, x, f + 1.6, z, 'Dark grey', 'metal', 'prop'))
    parts.push(dp(`${name}_Back`, 2, 2, 0.15, x, f + 2.8, z - 1, 'Dark grey', 'metal', 'prop'))
    for (const [dx, dz] of [[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]]) {
      parts.push(dp(`${name}_Leg_${dx}_${dz}`, 0.15, 1.6, 0.15, x + dx, f + 0.8, z + dz, 'Dark grey', 'metal', 'detail'))
    }
    return parts
  }

  // Office
  parts.push(dp(`${name}_SeatCushion`, 2, 0.3, 2, x, f + 1.9, z, color, 'fabric', 'prop'))
  parts.push(dp(`${name}_SeatShell`, 2.1, 0.2, 2.1, x, f + 1.7, z, 'Dark grey', 'smoothplastic', 'detail'))
  parts.push(dp(`${name}_BackCushion`, 1.9, 2, 0.25, x, f + 3, z - 0.75, color, 'fabric', 'prop'))
  parts.push(dp(`${name}_BackShell`, 2, 2.1, 0.15, x, f + 3, z - 0.75, 'Dark grey', 'smoothplastic', 'detail'))
  parts.push(dp(`${name}_ArmL`, 0.2, 0.1, 1.5, x - 0.8, f + 2.5, z, 'Dark grey', 'smoothplastic', 'detail'))
  parts.push(dp(`${name}_ArmR`, 0.2, 0.1, 1.5, x + 0.8, f + 2.5, z, 'Dark grey', 'smoothplastic', 'detail'))
  parts.push(dp(`${name}_ArmPostL`, 0.1, 0.5, 0.1, x - 0.8, f + 2.2, z, 'Dark grey', 'metal', 'detail'))
  parts.push(dp(`${name}_ArmPostR`, 0.1, 0.5, 0.1, x + 0.8, f + 2.2, z, 'Dark grey', 'metal', 'detail'))
  parts.push(dp(`${name}_Gas`, 0.25, 1.5, 0.25, x, f + 0.75, z, 'Medium stone grey', 'metal', 'detail'))
  parts.push(dp(`${name}_BaseA`, 3, 0.12, 0.3, x, f + 0.06, z, 'Dark grey', 'smoothplastic', 'detail'))
  parts.push(dp(`${name}_BaseB`, 0.3, 0.12, 3, x, f + 0.06, z, 'Dark grey', 'smoothplastic', 'detail'))
  for (const [wx, wz] of [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5], [1, 1]]) {
    parts.push(dp(`${name}_Wheel_${wx}_${wz}`, 0.3, 0.2, 0.3, x + wx, f, z + wz, 'Black', 'smoothplastic', 'detail'))
  }

  return parts
}

// ── Shelf ──────────────────────────────────────────────────────────────────

export function buildDetailedShelf(params: {
  name: string; x: number; y: number; z: number
  width?: number; depth?: number; shelfCount?: number
  color?: string; hasProducts?: boolean
  productColors?: string[]
}): DetailedPart[] {
  const { name, x, y, z, width = 4, depth = 1, shelfCount = 3, color = 'White', hasProducts = false,
    productColors = ['Bright red', 'Bright blue', 'Bright yellow', 'Bright green', 'Hot pink', 'Bright orange'] } = params
  const f = y + 1
  const totalH = shelfCount * 1.8 + 0.5
  const parts: DetailedPart[] = []

  parts.push(dp(`${name}_Back`, 0.1, totalH, depth, x, f + totalH / 2, z + depth / 2 - 0.05, color, 'smoothplastic', 'structure'))
  parts.push(dp(`${name}_SideL`, width, totalH, 0.1, x - width / 2 + 0.05, f + totalH / 2, z, color, 'smoothplastic', 'structure'))
  parts.push(dp(`${name}_SideR`, width, totalH, 0.1, x + width / 2 - 0.05, f + totalH / 2, z, color, 'smoothplastic', 'structure'))
  parts.push(dp(`${name}_Top`, width, 0.1, depth, x, f + totalH - 0.05, z, color, 'smoothplastic', 'structure'))
  parts.push(dp(`${name}_Bottom`, width, 0.1, depth, x, f + 0.05, z, color, 'smoothplastic', 'structure'))

  for (let si = 0; si < shelfCount; si++) {
    const sy = f + 0.15 + si * 1.8
    parts.push(dp(`${name}_Shelf${si}`, width - 0.1, 0.08, depth - 0.2, x, sy, z - 0.1, 'Light grey', 'smoothplastic', 'detail'))

    if (hasProducts) {
      const prodCount = Math.floor((width - 0.2) / 0.75)
      for (let pi = 0; pi < prodCount; pi++) {
        const px = x - width / 2 + 0.4 + pi * 0.75
        if (px > x + width / 2 - 0.4) break
        const pc = productColors[(si * prodCount + pi) % productColors.length]
        parts.push(dp(`${name}_Prod${si}_${pi}`, 0.65, 0.65, 0.65, px, sy + 0.4, z, pc, 'smoothplastic', 'accent'))
        parts.push(dp(`${name}_Label${si}_${pi}`, 0.02, 0.35, 0.5, px - 0.33, sy + 0.4, z, 'White', 'smoothplastic', 'accent'))
      }
    }
  }

  return parts
}

// ── Locker bank ────────────────────────────────────────────────────────────

export function buildDetailedLocker(params: {
  name: string; x: number; y: number; z: number
  color?: string; count?: number
  direction?: 'x' | 'z'
}): DetailedPart[] {
  const { name, x, y, z, color = 'Medium stone grey', count = 4, direction = 'x' } = params
  const f = y + 1
  const lW = 1.2; const lH = 6; const lD = 1.5
  const totalW = count * lW
  const parts: DetailedPart[] = []

  for (let i = 0; i < count; i++) {
    const off = -totalW / 2 + lW / 2 + i * lW
    const lx = direction === 'x' ? x + off : x
    const lz = direction === 'z' ? z + off : z
    const bsx = direction === 'x' ? lW : lD
    const bsz = direction === 'x' ? lD : lW
    parts.push(dp(`${name}_Body${i}`, bsx, lH, bsz, lx, f + lH / 2, lz, color, 'metal', 'prop'))
    parts.push(dp(`${name}_Seam${i}`, bsx - 0.05, 0.05, bsz, lx, f + lH / 2, lz, 'Dark grey', 'metal', 'detail'))
    parts.push(dp(`${name}_Handle${i}`, 0.1, 0.5, 0.4, lx + (direction === 'x' ? 0.3 : 0), f + lH / 2, lz + (direction === 'z' ? 0.3 : 0), 'Light grey', 'metal', 'detail'))
    parts.push(dp(`${name}_Vent${i}`, bsx - 0.1, 0.4, bsz - 0.1, lx, f + lH - 0.5, lz, 'Dark grey', 'metal', 'detail', 0.3))
    parts.push(dp(`${name}_Plate${i}`, direction === 'x' ? 0.4 : 0.1, 0.3, direction === 'x' ? 0.1 : 0.4, lx, f + lH * 0.75, lz, 'White', 'smoothplastic', 'detail'))
  }

  // Bench in front
  const bW = direction === 'x' ? totalW : 1
  const bD = direction === 'x' ? 1 : totalW
  const bx = x; const bz = z + (direction === 'x' ? lD / 2 + 0.5 : 0)
  parts.push(dp(`${name}_Bench`, bW, 0.3, bD, bx, f + 1.5, bz, 'Reddish brown', 'wood', 'prop'))
  const legSpacing = totalW / 3
  for (let li = 0; li < 3; li++) {
    const lOff = -totalW / 2 + legSpacing * (li + 0.5)
    const blx = direction === 'x' ? bx + lOff : bx
    const blz = direction === 'z' ? bz + lOff : bz
    parts.push(dp(`${name}_BenchLeg${li}`, 0.2, 1.5, 0.2, blx, f + 0.75, blz, 'Dark grey', 'metal', 'detail'))
  }

  return parts
}

// ── Wall fittings ──────────────────────────────────────────────────────────

export function buildWallDetails(params: {
  name: string; x: number; y: number; z: number
  width: number; height: number
  direction: 'north' | 'south' | 'east' | 'west'
  hasPowerSocket?: boolean; hasLightSwitch?: boolean
  hasCCTV?: boolean; hasRadiator?: boolean
}): DetailedPart[] {
  const { name, x, y, z, width, height, direction, hasPowerSocket, hasLightSwitch, hasCCTV, hasRadiator } = params
  const isNS = direction === 'north' || direction === 'south'
  const wOff = direction === 'north' ? 0.2 : direction === 'south' ? -0.2 : direction === 'east' ? -0.2 : 0.2
  const parts: DetailedPart[] = []

  if (hasPowerSocket) {
    const sx = isNS ? x - width * 0.3 : x + wOff
    const sz = isNS ? z + wOff : z - width * 0.3
    parts.push(dp(`${name}_Socket`, isNS ? 0.4 : 0.05, 0.3, isNS ? 0.05 : 0.4, sx, y + 1.4, sz, 'White', 'smoothplastic', 'detail'))
  }

  if (hasLightSwitch) {
    const sx = isNS ? x + width * 0.35 : x + wOff
    const sz = isNS ? z + wOff : z + width * 0.35
    parts.push(dp(`${name}_Switch`, isNS ? 0.3 : 0.05, 0.2, isNS ? 0.05 : 0.3, sx, y + 4, sz, 'White', 'smoothplastic', 'detail'))
  }

  if (hasCCTV) {
    const cx = isNS ? x + width * 0.45 : x + wOff * 1.5
    const cz = isNS ? z + wOff * 1.5 : z + width * 0.45
    parts.push(dp(`${name}_CCTVBracket`, 0.3, 0.3, 0.5, cx, y + height - 1.5, cz, 'Dark grey', 'metal', 'detail'))
    parts.push(dp(`${name}_CCTVBody`, 0.4, 0.3, 0.6, cx, y + height - 1.7, cz, 'Dark grey', 'smoothplastic', 'detail'))
    parts.push(dp(`${name}_CCTVLens`, 0.2, 0.2, 0.15, cx, y + height - 1.7, cz + wOff * 2, 'Black', 'smoothplastic', 'accent'))
  }

  if (hasRadiator) {
    const rx = isNS ? x - width * 0.2 : x + wOff
    const rz = isNS ? z + wOff : z - width * 0.2
    const radW = isNS ? 4 : 0.25
    const radD = isNS ? 0.25 : 4
    parts.push(dp(`${name}_Radiator`, radW, 2, radD, rx, y + 1.5, rz, 'White', 'smoothplastic', 'detail'))
    for (let ri = 0; ri < 3; ri++) {
      const rOff = -1.2 + ri * 1.2
      parts.push(dp(`${name}_RadFin${ri}`, isNS ? 0.1 : 0.3, 1.6, isNS ? 0.3 : 0.1, isNS ? rx + rOff : rx, y + 1.4, isNS ? rz : rz + rOff, 'Light grey', 'metal', 'detail'))
    }
  }

  return parts
}

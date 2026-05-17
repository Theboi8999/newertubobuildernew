import { RbxPart } from './rbxmx'
import { p } from './rbxmx'

export interface ColumnOpts {
  name: string
  x: number; y: number; z: number
  height: number
  radius?: number
  color: string
  material?: string
}

export interface ArchOpts {
  name: string
  x: number; y: number; z: number
  width: number
  height: number
  depth?: number
  color: string
  material?: string
}

export interface BallustradeOpts {
  name: string
  x: number; y: number; z: number
  length: number
  height?: number
  postCount?: number
  color: string
  material?: string
  axis?: 'x' | 'z'
}

export interface DormerOpts {
  name: string
  x: number; y: number; z: number
  width: number
  height: number
  depth?: number
  roofColor: string
  wallColor: string
}

export interface BayWindowOpts {
  name: string
  x: number; y: number; z: number
  width: number
  height: number
  projection?: number
  color: string
  trimColor: string
  material?: string
}

export interface PorchRoofOpts {
  name: string
  x: number; y: number; z: number
  width: number
  depth: number
  color: string
  material?: string
}

export function buildColumn(opts: ColumnOpts): RbxPart[] {
  const { name, x, y, z, height, color, material = 'smoothplastic' } = opts
  const r = opts.radius ?? 0.6
  const parts: RbxPart[] = []
  const shaft = r * 2
  parts.push(p(`${name}_Base`,   shaft + 0.6, 0.8, shaft + 0.6, x, y + 0.4, z, color, material))
  parts.push(p(`${name}_Shaft`,  shaft, height - 1.6, shaft, x, y + 0.8 + (height - 1.6) / 2, z, color, material))
  parts.push(p(`${name}_Capital`, shaft + 0.8, 0.8, shaft + 0.8, x, y + height - 0.4, z, color, material))
  return parts
}

export function buildArch(opts: ArchOpts): RbxPart[] {
  const { name, x, y, z, width, height, color, material = 'smoothplastic' } = opts
  const depth = opts.depth ?? 0.6
  const parts: RbxPart[] = []
  const jamb = width * 0.12
  const jh = height * 0.65
  parts.push(p(`${name}_JambL`, jamb, jh, depth, x - width / 2 + jamb / 2, y + jh / 2, z, color, material))
  parts.push(p(`${name}_JambR`, jamb, jh, depth, x + width / 2 - jamb / 2, y + jh / 2, z, color, material))
  const archH = height - jh
  const keyW = width - jamb * 2
  parts.push(p(`${name}_Lintel`, keyW, archH, depth, x, y + jh + archH / 2, z, color, material))
  parts.push(p(`${name}_Keystone`, jamb * 1.2, archH * 0.5, depth + 0.1, x, y + jh + archH * 0.3, z, 'White', 'smoothplastic'))
  return parts
}

export function buildBallustrade(opts: BallustradeOpts): RbxPart[] {
  const { name, x, y, z, length, color, material = 'smoothplastic', axis = 'x' } = opts
  const height = opts.height ?? 3.0
  const postCount = Math.max(2, opts.postCount ?? Math.floor(length / 3))
  const parts: RbxPart[] = []

  const railSx = axis === 'x' ? length : 0.25
  const railSz = axis === 'x' ? 0.25 : length
  parts.push(p(`${name}_Rail`, railSx, 0.3, railSz, x, y + height, z, color, material))
  parts.push(p(`${name}_BaseRail`, railSx, 0.3, railSz, x, y + 0.15, z, color, material))

  const step = length / (postCount - 1)
  for (let i = 0; i < postCount; i++) {
    const offset = -length / 2 + i * step
    const px = axis === 'x' ? x + offset : x
    const pz = axis === 'x' ? z : z + offset
    parts.push(p(`${name}_Post${i}`, 0.3, height, 0.3, px, y + height / 2, pz, color, material))
  }

  const balusters = postCount * 2 - 1
  const bstep = length / (balusters - 1)
  for (let i = 0; i < balusters; i++) {
    const offset = -length / 2 + i * bstep
    const px = axis === 'x' ? x + offset : x
    const pz = axis === 'x' ? z : z + offset
    const bh = height * 0.75
    parts.push(p(`${name}_Bal${i}`, 0.18, bh, 0.18, px, y + bh / 2, pz, color, material))
  }
  return parts
}

export function buildDormerWindow(opts: DormerOpts): RbxPart[] {
  const { name, x, y, z, width, height, roofColor, wallColor } = opts
  const depth = opts.depth ?? width * 0.6
  const parts: RbxPart[] = []
  parts.push(p(`${name}_Body`,  width, height, depth, x, y + height / 2, z, wallColor, 'smoothplastic'))
  parts.push(p(`${name}_Win`,   width * 0.55, height * 0.55, 0.15, x, y + height * 0.55, z - depth / 2 - 0.07, 'Bright blue', 'smoothplastic', 0.3))
  parts.push(p(`${name}_Frame`, width * 0.65, height * 0.65, 0.2, x, y + height * 0.55, z - depth / 2 - 0.1, 'White', 'smoothplastic'))
  const roofH = width * 0.35
  parts.push(p(`${name}_RoofL`, width / 2 + 0.2, 0.25, depth + 0.4, x - width / 4, y + height + roofH / 2, z, roofColor, 'concrete'))
  parts.push(p(`${name}_RoofR`, width / 2 + 0.2, 0.25, depth + 0.4, x + width / 4, y + height + roofH / 2, z, roofColor, 'concrete'))
  parts.push(p(`${name}_Ridge`, 0.3, roofH, depth + 0.4, x, y + height + roofH, z, roofColor, 'concrete'))
  return parts
}

export function buildBayWindow(opts: BayWindowOpts): RbxPart[] {
  const { name, x, y, z, width, height, color, trimColor, material = 'smoothplastic' } = opts
  const projection = opts.projection ?? width * 0.35
  const parts: RbxPart[] = []
  parts.push(p(`${name}_Front`, width, height, 0.4, x, y + height / 2, z - projection, color, material))
  parts.push(p(`${name}_Left`,  0.4, height, projection, x - width / 2, y + height / 2, z - projection / 2, color, material))
  parts.push(p(`${name}_Right`, 0.4, height, projection, x + width / 2, y + height / 2, z - projection / 2, color, material))
  const ww = width * 0.6
  const wh = height * 0.55
  parts.push(p(`${name}_Win`,   ww, wh, 0.15, x, y + height * 0.52, z - projection - 0.07, 'Bright blue', 'smoothplastic', 0.3))
  parts.push(p(`${name}_WinF`,  ww + 0.3, wh + 0.3, 0.2, x, y + height * 0.52, z - projection - 0.1, trimColor, 'smoothplastic'))
  parts.push(p(`${name}_Sill`,  width + 0.3, 0.3, projection + 0.3, x, y, z - projection / 2, trimColor, 'smoothplastic'))
  parts.push(p(`${name}_Cap`,   width + 0.3, 0.3, projection + 0.3, x, y + height, z - projection / 2, trimColor, 'smoothplastic'))
  return parts
}

export function buildPorchRoof(opts: PorchRoofOpts): RbxPart[] {
  const { name, x, y, z, width, depth, color, material = 'concrete' } = opts
  const parts: RbxPart[] = []
  const roofH = width * 0.12
  parts.push(p(`${name}_Slab`, width + 0.4, 0.4, depth, x, y, z - depth / 2, color, material))
  parts.push(p(`${name}_Fascia`, width + 0.6, roofH, 0.35, x, y + roofH / 2, z - depth - 0.17, color, material))
  parts.push(p(`${name}_Drip`, width + 0.8, 0.2, 0.4, x, y + roofH, z - depth - 0.2, 'White', 'smoothplastic'))
  return parts
}

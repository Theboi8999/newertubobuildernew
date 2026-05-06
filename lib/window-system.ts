export interface WindowSpec {
  x: number
  y: number
  z: number
  width: number
  height: number
  direction: 'north' | 'south' | 'east' | 'west'
  style: string
  wallColor: string
}

const PHI = 1.618

export function calculateWindowPositions(
  wallLength: number,
  floorHeight: number,
  wallY: number,
  style: string
): Array<{ offset: number; width: number; height: number }> {
  const styleConfig: Record<string, { ratio: number; heightRatio: number; minCount: number }> = {
    modern:     { ratio: 0.55, heightRatio: 0.45, minCount: 2 },
    colonial:   { ratio: 0.40, heightRatio: 0.50, minCount: 2 },
    victorian:  { ratio: 0.35, heightRatio: 0.55, minCount: 2 },
    chinese:    { ratio: 0.38, heightRatio: 0.48, minCount: 2 },
    peranakan:  { ratio: 0.38, heightRatio: 0.48, minCount: 2 },
    industrial: { ratio: 0.60, heightRatio: 0.55, minCount: 1 },
  }

  const detectedStyle = Object.keys(styleConfig).find(k => style.toLowerCase().includes(k)) || 'modern'
  const config = styleConfig[detectedStyle]

  const optimalCount = Math.max(
    config.minCount,
    Math.round(wallLength / (floorHeight * PHI))
  )
  const count = Math.min(optimalCount, Math.floor(wallLength / 4))

  if (count === 0) return []

  const totalWindowWidth = wallLength * config.ratio
  const winW = totalWindowWidth / count
  const gap = (wallLength - totalWindowWidth) / (count + 1)
  const winH = floorHeight * config.heightRatio

  const positions: Array<{ offset: number; width: number; height: number }> = []
  for (let i = 0; i < count; i++) {
    const offset = gap + i * (winW + gap) + winW / 2 - wallLength / 2
    positions.push({ offset, width: winW, height: winH })
  }
  return positions
}

export function buildProportionalWindow(
  spec: WindowSpec
): Array<{ name: string; size: { x: number; y: number; z: number }; position: { x: number; y: number; z: number }; color: string; material: string; anchored: boolean; transparency: number; emissive: boolean }> {
  const parts: ReturnType<typeof buildProportionalWindow> = []
  const { x, y, z, width, height, direction, style, wallColor } = spec
  const isNS = direction === 'north' || direction === 'south'
  const depth = 0.25
  const frameW = Math.max(0.15, width * 0.08)
  const sillDepth = Math.max(0.2, width * 0.12)
  const sillHeight = 0.2

  const mkPart = (
    name: string, sx: number, sy: number, sz: number,
    px: number, py: number, pz: number,
    color: string, mat: string, trans = 0
  ) => ({
    name,
    size: { x: Math.max(0.05, sx), y: Math.max(0.05, sy), z: Math.max(0.05, sz) },
    position: { x: px, y: py, z: pz },
    color, material: mat, anchored: true, transparency: trans, emissive: false
  })

  // Frame — 4 sides
  parts.push(mkPart(`${direction}_WinFT`, isNS ? width + frameW * 2 : depth, frameW, isNS ? depth : width + frameW * 2, x, y + height / 2 + frameW / 2, z, wallColor, 'smoothplastic'))
  parts.push(mkPart(`${direction}_WinFB`, isNS ? width + frameW * 2 : depth, frameW, isNS ? depth : width + frameW * 2, x, y - height / 2 - frameW / 2, z, wallColor, 'smoothplastic'))
  parts.push(mkPart(`${direction}_WinFL`, isNS ? frameW : depth, height + frameW * 2, isNS ? depth : frameW, isNS ? x - width / 2 - frameW / 2 : x, y, isNS ? z : z - width / 2 - frameW / 2, wallColor, 'smoothplastic'))
  parts.push(mkPart(`${direction}_WinFR`, isNS ? frameW : depth, height + frameW * 2, isNS ? depth : frameW, isNS ? x + width / 2 + frameW / 2 : x, y, isNS ? z : z + width / 2 + frameW / 2, wallColor, 'smoothplastic'))

  // Sill
  parts.push(mkPart(`${direction}_WinSill`, isNS ? width + frameW * 2 + 0.2 : sillDepth, sillHeight, isNS ? sillDepth : width + frameW * 2 + 0.2, x, y - height / 2 - frameW - sillHeight / 2, z, wallColor, 'smoothplastic'))

  // Glass
  const glassInset = 0.08
  const glassX = isNS ? x : x + (direction === 'west' ? glassInset : -glassInset)
  const glassZ = isNS ? z + (direction === 'north' ? glassInset : -glassInset) : z
  parts.push(mkPart(`${direction}_WinGlass`, isNS ? width : 0.06, height, isNS ? 0.06 : width, glassX, y, glassZ, 'Institutional white', 'smoothplastic', 0.4))

  // Style-specific details
  if (style === 'chinese' || style.includes('peranakan') || style.includes('colonial')) {
    const latW = 0.06
    parts.push(mkPart(`${direction}_LatH1`, isNS ? width : latW, latW, isNS ? latW : width, x, y + height * 0.2, z, 'White', 'smoothplastic'))
    parts.push(mkPart(`${direction}_LatH2`, isNS ? width : latW, latW, isNS ? latW : width, x, y - height * 0.2, z, 'White', 'smoothplastic'))
    parts.push(mkPart(`${direction}_LatV`, isNS ? latW : latW, height * 0.9, isNS ? latW : latW, x, y, z, 'White', 'smoothplastic'))
  } else if (style === 'victorian' || style.includes('georgian') || style.includes('classical')) {
    parts.push(mkPart(`${direction}_Lintel`, isNS ? width + frameW * 3 : depth + 0.1, frameW * 1.5, isNS ? depth + 0.1 : width + frameW * 3, x, y + height / 2 + frameW * 1.5, z, wallColor, 'smoothplastic'))
    parts.push(mkPart(`${direction}_MidBar`, isNS ? width : 0.06, 0.06, isNS ? 0.06 : width, x, y, z, 'White', 'smoothplastic'))
    parts.push(mkPart(`${direction}_Key`, isNS ? frameW * 2 : depth, frameW * 2.5, isNS ? depth : frameW * 2, x, y + height / 2 + frameW * 0.5, z, wallColor, 'smoothplastic'))
  } else if (style === 'modern' || style.includes('contemporary')) {
    parts.push(mkPart(`${direction}_RevealL`, isNS ? 0.04 : depth, height + frameW * 2, isNS ? depth : 0.04, isNS ? x - width / 2 - frameW - 0.05 : x, y, isNS ? z : z - width / 2 - frameW - 0.05, 'Dark grey', 'smoothplastic'))
    parts.push(mkPart(`${direction}_RevealR`, isNS ? 0.04 : depth, height + frameW * 2, isNS ? depth : 0.04, isNS ? x + width / 2 + frameW + 0.05 : x, y, isNS ? z : z + width / 2 + frameW + 0.05, 'Dark grey', 'smoothplastic'))
  } else if (style === 'industrial') {
    parts.push(mkPart(`${direction}_SteelH`, isNS ? width : 0.1, 0.1, isNS ? 0.1 : width, x, y, z, 'Dark grey', 'metal'))
    parts.push(mkPart(`${direction}_SteelV`, isNS ? 0.1 : 0.1, height, isNS ? 0.1 : 0.1, x, y, z, 'Dark grey', 'metal'))
  }

  return parts
}

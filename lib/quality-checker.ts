import type { RbxPart } from './rbxmx'
import type { ResearchResult } from './research-agent'
import type { RoomLayoutItem } from './blueprint-compiler'

export interface QualityCheck {
  name: string
  passed: boolean
  score: number
  note: string
  expected?: string
  found?: string
  impact?: number
}

export interface QualityCheckResult {
  checks: QualityCheck[]
  percentage: number
  suggestions: string[]
}

export function checkBuildingQuality(
  parts: RbxPart[],
  research: ResearchResult | null,
  buildingType: string,
  roomLayout?: RoomLayoutItem[],
  options?: { hasStaircases?: boolean }
): QualityCheckResult {
  const checks: QualityCheck[] = []
  const suggestions: string[] = []

  const partNames = parts.map(p => p.name)
  const colorsUsed = parts.map(p => p.color)

  const partCount = parts.length
  const partScore = partCount >= 1000 ? 100 : partCount >= 600 ? 85 : partCount >= 300 ? 70 : partCount >= 150 ? 50 : partCount >= 50 ? 30 : 10
  checks.push({ name: 'Part Count', passed: partCount >= 50, score: partScore, note: `${partCount} parts` })
  if (partCount < 100) suggestions.push('Add more structural detail — target 100+ parts')

  const colors = new Set(parts.map(p => p.color))
  const colorScore = colors.size >= 5 ? 100 : colors.size >= 3 ? 70 : colors.size >= 2 ? 50 : 20
  checks.push({ name: 'Color Variety', passed: colors.size >= 2, score: colorScore, note: `${colors.size} distinct colors` })
  if (colors.size < 3) suggestions.push('Use more varied colors for realism')

  const hasWalls = parts.some(p => p.name.toLowerCase().includes('wall'))
  checks.push({ name: 'Wall Parts', passed: hasWalls, score: hasWalls ? 100 : 0, note: hasWalls ? 'Walls present' : 'No wall parts found' })
  if (!hasWalls) suggestions.push('Building must have wall parts')

  const hasFloors = partNames.some(n =>
    n.toLowerCase().includes('floor') ||
    n.toLowerCase().includes('ground') ||
    n.toLowerCase().includes('slab') ||
    n.toLowerCase().includes('terrain')
  )
  checks.push({ name: 'Floor/Ground Parts', passed: hasFloors, score: hasFloors ? 100 : 0, note: hasFloors ? 'Floor/ground present' : 'No floor or ground parts' })
  if (!hasFloors) suggestions.push('Add floor or ground parts')

  if (research) {
    const expectedColor = (research.exteriorColor || '').toLowerCase()
    const wallParts = parts.filter(p => p.name.toLowerCase().includes('wall'))
    const wallColors = Array.from(new Set(wallParts.map(p => p.color.toLowerCase())))
    const wallColorOk = !expectedColor || wallColors.some(c => c === expectedColor || c.includes(expectedColor.split(' ')[0]))
    checks.push({ name: 'Wall Color', passed: wallColorOk, score: wallColorOk ? 100 : 50, note: wallColorOk ? `Walls use ${research.exteriorColor}` : `Walls: ${wallColors.slice(0, 2).join(', ')} (expected ${research.exteriorColor})` })
    if (!wallColorOk) suggestions.push(`Wall color mismatch — expected ${research.exteriorColor}`)
  }

  const hasStreetFurniture = parts.some(p => {
    const n = p.name.toLowerCase()
    return n.includes('terrain') || n.includes('bench') || n.includes('bollard') || n.includes('tree') || n.includes('road') || n.includes('lamp')
  })
  checks.push({ name: 'Street Furniture', passed: hasStreetFurniture, score: hasStreetFurniture ? 100 : 30, note: hasStreetFurniture ? 'Street elements present' : 'No street furniture' })
  if (!hasStreetFurniture) suggestions.push('Add street furniture (trees, benches, road)')

  const hasExterior = parts.some(p =>
    ['ground', 'pavement', 'fascia', 'roof', 'parapet', 'slab', 'lamp', 'kerb'].some(k => p.name.toLowerCase().includes(k))
  )
  checks.push({ name: 'Exterior Detail', passed: hasExterior, score: hasExterior ? 100 : 30, note: hasExterior ? 'Exterior details present' : 'Minimal exterior detail' })
  if (!hasExterior) suggestions.push('Add exterior details like pavement, fascia, roof')

  if (research) {
    const fc = research.floorCount || 1
    const fh = research.floorHeight || 10
    const expectedHeight = fc * fh
    const tallestY = parts.length > 0 ? Math.max(...parts.map(p => p.position.y + p.size.y / 2)) : 0
    const heightRatio = tallestY / expectedHeight
    const heightOk = tallestY > 0 && heightRatio >= 0.6 && heightRatio <= 1.8
    checks.push({ name: 'Building Height', passed: heightOk, score: heightOk ? 100 : 40, note: `${Math.round(tallestY)} studs tall (expected ~${expectedHeight})` })
    if (!heightOk) suggestions.push(`Adjust building height — expected ~${expectedHeight} studs for ${fc} floor(s)`)
  }

  const hasWindows = parts.some(p => {
    const n = p.name.toLowerCase()
    return n.includes('win') || n.includes('glass') || n.includes('_fw') || n.includes('_lw') || n.includes('_rw')
  })
  checks.push({ name: 'Window Details', passed: hasWindows, score: hasWindows ? 100 : 20, note: hasWindows ? 'Windows present' : 'No window parts found' })
  if (!hasWindows) suggestions.push('Add window details to the facade')

  const materials = new Set(parts.map(p => p.material))
  const matScore = materials.size >= 4 ? 100 : materials.size >= 3 ? 75 : materials.size >= 2 ? 50 : 25
  checks.push({ name: 'Material Variety', passed: materials.size >= 2, score: matScore, note: `${materials.size} distinct materials` })
  if (materials.size < 3) suggestions.push('Use more material types (concrete, brick, wood, metal)')

  // CHECK: Building footprint matches research dimensions (within 20%)
  if (research) {
    const expectedW = research.totalWidth || 40
    const expectedD = research.totalDepth || 30
    const allX = parts.map(p => p.position.x)
    const allZ = parts.map(p => p.position.z)
    if (allX.length > 0 && allZ.length > 0) {
      const actualW = Math.max(...allX) - Math.min(...allX)
      const actualD = Math.max(...allZ) - Math.min(...allZ)
      const wRatio = actualW / expectedW
      const dRatio = actualD / expectedD
      const footprintOk = wRatio >= 0.7 && wRatio <= 1.5 && dRatio >= 0.7 && dRatio <= 1.5
      checks.push({ name: 'Footprint Size', passed: footprintOk, score: footprintOk ? 100 : 50, note: `${Math.round(actualW)}×${Math.round(actualD)} (target ~${expectedW}×${expectedD})` })
      if (!footprintOk) suggestions.push(`Building footprint ${Math.round(actualW)}×${Math.round(actualD)} deviates significantly from target ${expectedW}×${expectedD}`)
    }
  }

  // CHECK: Room overlap (BSP should prevent this but verify)
  if (roomLayout && roomLayout.length > 1) {
    let overlaps = 0
    for (let i = 0; i < roomLayout.length; i++) {
      for (let j = i + 1; j < roomLayout.length; j++) {
        const a = roomLayout[i]
        const b = roomLayout[j]
        const aLeft = a.x - a.width / 2
        const aRight = a.x + a.width / 2
        const aTop = a.z - a.depth / 2
        const aBot = a.z + a.depth / 2
        const bLeft = b.x - b.width / 2
        const bRight = b.x + b.width / 2
        const bTop = b.z - b.depth / 2
        const bBot = b.z + b.depth / 2
        if (aLeft < bRight && aRight > bLeft && aTop < bBot && aBot > bTop) overlaps++
      }
    }
    const noOverlap = overlaps === 0
    checks.push({ name: 'Room Overlap', passed: noOverlap, score: noOverlap ? 100 : Math.max(0, 100 - overlaps * 20), note: noOverlap ? 'No room overlaps' : `${overlaps} overlapping room pair(s)` })
    if (!noOverlap) suggestions.push(`${overlaps} room(s) overlap — BSP layout may need review`)
  }

  if (research) {
    const bt = (research.buildingType || '').toLowerCase()
    const st = (research.architecturalStyle || '').toLowerCase()
    const needsPagoda = bt.includes('peranakan') || bt.includes('shophouse') || bt.includes('singapore') || st.includes('chinese') || st.includes('peranakan')
    if (needsPagoda) {
      const hasPagoda = partNames.some(n => n.toLowerCase().startsWith('pag'))
      checks.push({ name: 'Pagoda Roof Tiers', passed: hasPagoda, score: hasPagoda ? 100 : 0, note: hasPagoda ? 'found' : 'MISSING — isChinese not triggering', expected: 'Pag* parts on each floor', found: hasPagoda ? 'found' : 'MISSING — isChinese not triggering', impact: 25 })
      if (!hasPagoda) suggestions.push('CRITICAL: Pagoda roofs missing')
    }
    if (research.hasColonnade) {
      const hasCol = partNames.some(n => {
        const nl = n.toLowerCase()
        return nl.startsWith('col') || nl.includes('arch') || nl.includes('pillar')
      })
      checks.push({ name: 'Colonnade', passed: hasCol, score: hasCol ? 100 : 0, note: hasCol ? 'found' : 'MISSING', expected: 'Col* or Arch* parts', found: hasCol ? 'found' : 'MISSING', impact: 20 })
      if (!hasCol) suggestions.push('CRITICAL: Colonnade missing')
    }
    const colorApplied = colorsUsed.includes(research.exteriorColor)
    checks.push({
      name: 'Exterior Color Applied',
      passed: colorApplied,
      score: colorApplied ? 100 : 0,
      note: colorApplied ? research.exteriorColor : `not found — colors used: ${Array.from(new Set(colorsUsed)).slice(0,6).join(', ')}`,
      expected: research.exteriorColor,
      found: colorApplied ? research.exteriorColor : `not found`,
      impact: 20
    })
    if (!colorApplied) suggestions.push(`CRITICAL: ${research.exteriorColor} not in output — color pipeline broken`)
  }

  if (research && (research.floorCount || 1) > 1) {
    const hasMultiFloor = parts.some(p => {
      const n = p.name
      return n.includes('F1_') || n.includes('F2_') || n.includes('Floor_1') ||
        n.includes('FloorSlab_F1') || n.includes('Stair_')
    })
    checks.push({ name: 'Multi-Floor Distribution', passed: hasMultiFloor, score: hasMultiFloor ? 100 : 40, note: hasMultiFloor ? 'Multi-floor parts present' : 'No multi-floor distribution detected' })
    if (!hasMultiFloor) suggestions.push('Multi-floor building missing floor distribution parts')

    if (options?.hasStaircases) {
      const hasStairs = parts.some(p => p.name.includes('Stair_'))
      checks.push({ name: 'Staircase Present', passed: hasStairs, score: hasStairs ? 100 : 0, note: hasStairs ? 'Staircases found' : 'MISSING — staircases requested but not generated' })
      if (!hasStairs) suggestions.push('CRITICAL: Staircases missing despite hasStaircases=true')
    }
  }

  const percentage = Math.round(checks.reduce((sum, c) => sum + c.score, 0) / checks.length)
  return { checks, percentage, suggestions }
}

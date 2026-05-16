import { RbxPart } from '../rbxmx'
import { p } from '../rbxmx'
import { StyleDNA } from '../style/style-dna'
import { BuildPlan } from '../blueprint-compiler'

export function generateRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  if (plan.buildingType.toLowerCase().includes('shophouse')) return generateShophouseRoof(plan, dna)
  switch (dna.roofType) {
    case 'pagoda': return generatePagodaRoof(plan, dna)
    case 'gable':  return generateGableRoof(plan, dna)
    case 'hip':    return generateHipRoof(plan, dna)
    case 'shed':   return generateShedRoof(plan, dna)
    case 'flat':
    default:       return generateFlatRoof(plan, dna)
  }
}

function generatePagodaRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, floorCount, floorHeight } = plan
  const rc = dna.roofColor
  const isChinese = dna.family === 'asian'
  const bandColor = isChinese ? (dna.roofColor || 'Dark green') : dna.floorBandColor

  // Inner eave color — lighter variant of roof color
  const innerEaveColor = rc === 'Dark green' ? 'Medium green'
    : rc === 'Dark grey' ? 'Light stone grey'
    : rc

  for (let f = 0; f < floorCount; f++) {
    const fy = wallBase + f * floorHeight
    const ry = fy + floorHeight

    if (f > 0) {
      parts.push(p(`Band_F${f}`, tw + 1.5, 2.0, 1.2, tw / 2, fy + 1.0, -0.6, bandColor, 'smoothplastic'))
      parts.push(p(`Band_B${f}`, tw + 1.5, 2.0, 1.2, tw / 2, fy + 1.0, td + 0.6, bandColor, 'smoothplastic'))
      parts.push(p(`Band_L${f}`, 1.2, 2.0, td + 1.5, -0.6, fy + 1.0, td / 2, bandColor, 'smoothplastic'))
      parts.push(p(`Band_R${f}`, 1.2, 2.0, td + 1.5, tw + 0.6, fy + 1.0, td / 2, bandColor, 'smoothplastic'))
      parts.push(p(`Drip_F${f}`, tw + 2.0, 0.3, 0.5, tw / 2, fy - 0.15, -0.7, bandColor, 'smoothplastic'))
      parts.push(p(`Drip_B${f}`, tw + 2.0, 0.3, 0.5, tw / 2, fy - 0.15, td + 0.7, bandColor, 'smoothplastic'))
    }

    // Layer 1 — main eave: tw+8 × 1.4 × td+8 (4 studs each side)
    const L1y = ry + 0.7
    parts.push(p(`Pag${f}`, tw + 8, 1.4, td + 8, tw / 2, L1y, td / 2, rc, 'smoothplastic'))

    // Layer 2 — mid eave: tw+5 × 0.5 × td+5, 0.4 below Layer 1
    const L2y = L1y - 0.4
    parts.push(p(`PagL2_${f}`, tw + 5, 0.5, td + 5, tw / 2, L2y, td / 2, rc, 'smoothplastic'))

    // Layer 3 — inner eave: tw+2 × 0.4 × td+2, 0.8 below Layer 1
    const L3y = L1y - 0.8
    parts.push(p(`PagL3_${f}`, tw + 2, 0.4, td + 2, tw / 2, L3y, td / 2, innerEaveColor, 'smoothplastic'))

    // Upturned corner tips per layer — 1.5 × 1.5 × 1.5 White, Y = layer Y + 0.6
    const layers = [
      { y: L1y + 0.6, offset: 4.0 },
      { y: L2y + 0.6, offset: 2.5 },
      { y: L3y + 0.6, offset: 1.0 },
    ]
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li]
      const cx0 = tw / 2 - layer.offset; const cx1 = tw / 2 + layer.offset
      const cz0 = td / 2 - layer.offset; const cz1 = td / 2 + layer.offset
      const tipCorners: [number, number][] = [[cx0, cz0], [cx1, cz0], [cx0, cz1], [cx1, cz1]]
      for (let ci = 0; ci < tipCorners.length; ci++) {
        const [cpx, cpz] = tipCorners[ci]
        parts.push(p(`PagTip_${f}_${li}_${ci}`, 1.5, 1.5, 1.5, cpx, layer.y, cpz, 'White', 'smoothplastic'))
      }
    }

    // Drip edge along bottom outer edge of Layer 1 — 0.3 tall, Dark grey metal
    const dripY = L1y - 0.7 - 0.15  // bottom face of layer 1
    const eaveHalf = (tw + 8) / 2
    const eaveHalfD = (td + 8) / 2
    parts.push(p(`PagDrip_${f}_F`, tw + 8.2, 0.3, 0.4, tw / 2, dripY, td / 2 - eaveHalfD - 0.2, 'Dark grey', 'metal'))
    parts.push(p(`PagDrip_${f}_B`, tw + 8.2, 0.3, 0.4, tw / 2, dripY, td / 2 + eaveHalfD + 0.2, 'Dark grey', 'metal'))
    parts.push(p(`PagDrip_${f}_L`, 0.4, 0.3, td + 8.2, tw / 2 - eaveHalf - 0.2, dripY, td / 2, 'Dark grey', 'metal'))
    parts.push(p(`PagDrip_${f}_R`, 0.4, 0.3, td + 8.2, tw / 2 + eaveHalf + 0.2, dripY, td / 2, 'Dark grey', 'metal'))

    // Underside soffit — tw+6 × 0.3 × td+6, Institutional white, 0.7 below L1
    parts.push(p(`PagSoffit_${f}`, tw + 6, 0.3, td + 6, tw / 2, L1y - 0.7 - 0.15, td / 2, 'Institutional white', 'smoothplastic'))

    // Ridge sits on top of main eave
    parts.push(p(`PagRidge${f}`, tw + 6, 0.5, 0.6, tw / 2, L1y + 0.7 + 0.25, td / 2, rc, 'smoothplastic'))
  }

  const topRy = wallBase + floorCount * floorHeight
  parts.push(p('TopRoofCap', 2.0, 0.6, 2.0, tw / 2, topRy + 1.8, td / 2, rc, 'smoothplastic'))
  parts.push(p('TopRoofRidge', tw + 2, 0.5, 0.6, tw / 2, topRy + 2.1, td / 2, rc, 'smoothplastic'))
  parts.push(p('RoofAC1', 2.5, 1.5, 2.5, tw / 3, topRy + 2.0, td / 3, 'Dark grey', 'smoothplastic'))
  parts.push(p('RoofAC2', 2.5, 1.5, 2.5, tw * 2 / 3, topRy + 2.0, td * 2 / 3, 'Dark grey', 'smoothplastic'))
  parts.push(p('RoofTank', 2.2, 3.0, 2.2, tw / 2, topRy + 3.3, td / 2, 'Medium stone grey', 'smoothplastic'))

  return parts
}

function generateShophouseRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, floorCount, floorHeight } = plan
  const topY = wallBase + floorCount * floorHeight
  const ec = dna.primaryColor
  const parapetH = plan.proportions?.parapetHeight ?? 1.5

  // Flat roof deck — concrete, wall color
  parts.push(p('Roof', tw + 0.4, 0.8, td + 0.4, tw / 2, topY + 0.4, td / 2, ec, 'concrete'))

  // Parapet walls — proportional height, all 4 sides; Light stone grey for peranakan-style parapets
  const parY = topY + 0.8 + parapetH / 2
  const parColor = 'Light stone grey'
  parts.push(p('Parapet_F', tw + 0.4, parapetH, 0.5, tw / 2, parY, 0.25, parColor, 'smoothplastic'))
  parts.push(p('Parapet_B', tw + 0.4, parapetH, 0.5, tw / 2, parY, td - 0.25, parColor, 'smoothplastic'))
  parts.push(p('Parapet_L', 0.5, parapetH, td, 0.25, parY, td / 2, parColor, 'smoothplastic'))
  parts.push(p('Parapet_R', 0.5, parapetH, td, tw - 0.25, parY, td / 2, parColor, 'smoothplastic'))

  // Parapet coping — white cap on each parapet
  const copY = topY + 0.8 + parapetH + 0.4
  parts.push(p('ParapetCop_F', tw + 0.8, 0.4, 0.7, tw / 2, copY, 0.35, 'White', 'smoothplastic'))
  parts.push(p('ParapetCop_B', tw + 0.8, 0.4, 0.7, tw / 2, copY, td - 0.35, 'White', 'smoothplastic'))
  parts.push(p('ParapetCop_L', 0.7, 0.4, td + 0.8, 0.35, copY, td / 2, 'White', 'smoothplastic'))
  parts.push(p('ParapetCop_R', 0.7, 0.4, td + 0.8, tw - 0.35, copY, td / 2, 'White', 'smoothplastic'))

  // Decorative pilasters on front parapet — every 2.5 studs
  const pilSpacing = 2.5
  const pilCount = Math.max(4, Math.floor(tw / pilSpacing) - 1)
  for (let pi = 0; pi < pilCount; pi++) {
    const px = tw / (pilCount + 1) * (pi + 1)
    parts.push(p(`ParPil_${pi}`, 0.6, 1.0, 0.6, px, topY + 1.8, 0.3, 'White', 'smoothplastic'))
  }

  // Roof detail
  parts.push(p('RoofAC1', 3, 1.8, 3, tw / 3, topY + 1.9, td / 3, 'Dark grey', 'smoothplastic'))
  parts.push(p('RoofAC2', 3, 1.8, 3, tw * 2 / 3, topY + 1.9, td * 2 / 3, 'Dark grey', 'smoothplastic'))
  parts.push(p('RoofTank', 2.2, 3.0, 2.2, tw / 2, topY + 3.3, td / 2, 'Medium stone grey', 'smoothplastic'))

  return parts
}

function generateFlatRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, floorCount, floorHeight } = plan
  const topY = wallBase + floorCount * floorHeight
  const rc = dna.roofColor

  parts.push(p('Roof', tw + 1.5, 1.0, td + 1.5, tw / 2, topY + 0.5, td / 2, rc, 'smoothplastic'))
  parts.push(p('Parapet_F', tw + 1.5, 1.8, 0.6, tw / 2, topY + 1.4, -0.3, dna.primaryColor, 'smoothplastic'))
  parts.push(p('Parapet_B', tw + 1.5, 1.8, 0.6, tw / 2, topY + 1.4, td + 0.3, dna.primaryColor, 'smoothplastic'))
  parts.push(p('Parapet_L', 0.6, 1.8, td + 1.5, -0.3, topY + 1.4, td / 2, dna.primaryColor, 'smoothplastic'))
  parts.push(p('Parapet_R', 0.6, 1.8, td + 1.5, tw + 0.3, topY + 1.4, td / 2, dna.primaryColor, 'smoothplastic'))
  parts.push(p('RoofAC1', 3, 1.8, 3, tw / 3, topY + 1.9, td / 3, 'Dark grey', 'smoothplastic'))
  parts.push(p('RoofAC2', 3, 1.8, 3, tw * 2 / 3, topY + 1.9, td * 2 / 3, 'Dark grey', 'smoothplastic'))

  return parts
}

function generateGableRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, floorCount, floorHeight } = plan
  const baseY = wallBase + floorCount * floorHeight
  const pitch = dna.roofPitch || 35
  const overhang = dna.roofOverhang || 2
  const roofH = Math.tan(pitch * Math.PI / 180) * (td / 2)
  const rc = dna.roofColor

  const steps = 8
  for (let s = 0; s < steps; s++) {
    const ratio = s / steps
    const nextRatio = (s + 1) / steps
    const sliceD = td / 2 / steps
    const sliceY = baseY + roofH * ratio
    const sliceH = roofH * (nextRatio - ratio) + 0.1
    parts.push(p(`RoofSL_${s}`, tw + overhang * 2, sliceH, sliceD,
      tw / 2, sliceY + sliceH / 2, sliceD / 2 + s * sliceD, rc, 'smoothplastic'))
    parts.push(p(`RoofSR_${s}`, tw + overhang * 2, sliceH, sliceD,
      tw / 2, sliceY + sliceH / 2, td - sliceD / 2 - s * sliceD, rc, 'smoothplastic'))
  }

  parts.push(p('RoofRidge', tw + overhang * 2, 0.5, 0.8,
    tw / 2, baseY + roofH + 0.25, td / 2, rc, 'smoothplastic'))
  parts.push(p('FasciaF', tw + overhang * 2, 0.8, 0.4,
    tw / 2, baseY + 0.4, -overhang, dna.trimColor, 'smoothplastic'))
  parts.push(p('FasciaB', tw + overhang * 2, 0.8, 0.4,
    tw / 2, baseY + 0.4, td + overhang, dna.trimColor, 'smoothplastic'))

  return parts
}

function generateHipRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, floorCount, floorHeight } = plan
  const baseY = wallBase + floorCount * floorHeight
  const pitch = dna.roofPitch || 35
  const overhang = dna.roofOverhang || 2
  const rc = dna.roofColor

  const roofH = Math.tan(pitch * Math.PI / 180) * (td / 2)
  const ridgeLen = Math.max(1, tw - td)
  const steps = 8

  for (let s = 0; s < steps; s++) {
    const ratio = s / steps
    const nextRatio = (s + 1) / steps
    const sliceD = td / 2 / steps
    const sliceY = baseY + roofH * ratio
    const sliceH = roofH * (nextRatio - ratio) + 0.1
    const widthAtBase = tw + overhang * 2
    const widthAtRidge = Math.max(ridgeLen + 1, tw - td + overhang)
    const sliceW = widthAtBase - (widthAtBase - widthAtRidge) * nextRatio

    parts.push(p(`HipF_${s}`, sliceW, sliceH, sliceD,
      tw / 2, sliceY + sliceH / 2, sliceD / 2 + s * sliceD, rc, 'smoothplastic'))
    parts.push(p(`HipB_${s}`, sliceW, sliceH, sliceD,
      tw / 2, sliceY + sliceH / 2, td - sliceD / 2 - s * sliceD, rc, 'smoothplastic'))
  }

  for (let s = 0; s < steps; s++) {
    const ratio = s / steps
    const nextRatio = (s + 1) / steps
    const sliceW = td / 2 / steps
    const sliceY = baseY + roofH * ratio
    const sliceH = roofH * (nextRatio - ratio) + 0.1
    const lenAtBase = td + overhang * 2
    const sliceLen = lenAtBase * (1 - nextRatio) + 0.6

    parts.push(p(`HipL_${s}`, sliceW, sliceH, Math.max(0.4, sliceLen),
      sliceW / 2 + s * sliceW - overhang, sliceY + sliceH / 2, td / 2, rc, 'smoothplastic'))
    parts.push(p(`HipR_${s}`, sliceW, sliceH, Math.max(0.4, sliceLen),
      tw - sliceW / 2 - s * sliceW + overhang, sliceY + sliceH / 2, td / 2, rc, 'smoothplastic'))
  }

  parts.push(p('HipRidge', Math.max(ridgeLen, 1), 0.5, 0.8,
    tw / 2, baseY + roofH + 0.25, td / 2, rc, 'smoothplastic'))

  parts.push(p('HipGutF', tw + overhang * 2 + 0.5, 0.4, 0.6,
    tw / 2, baseY + 0.2, -overhang - 0.3, dna.trimColor, 'smoothplastic'))
  parts.push(p('HipGutB', tw + overhang * 2 + 0.5, 0.4, 0.6,
    tw / 2, baseY + 0.2, td + overhang + 0.3, dna.trimColor, 'smoothplastic'))
  parts.push(p('HipGutL', 0.6, 0.4, td + overhang * 2 + 0.5,
    -overhang - 0.3, baseY + 0.2, td / 2, dna.trimColor, 'smoothplastic'))
  parts.push(p('HipGutR', 0.6, 0.4, td + overhang * 2 + 0.5,
    tw + overhang + 0.3, baseY + 0.2, td / 2, dna.trimColor, 'smoothplastic'))

  return parts
}

function generateShedRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, floorCount, floorHeight } = plan
  const baseY = wallBase + floorCount * floorHeight
  const rc = dna.roofColor
  parts.push(p('ShedRoof', tw + 2, 1.0, td + 2, tw / 2, baseY + 0.5, td / 2, rc, 'smoothplastic'))
  parts.push(p('ShedRoofRise', tw + 2, 2.0, 0.6, tw / 2, baseY + 1.5, td + 1, rc, 'smoothplastic'))
  return parts
}

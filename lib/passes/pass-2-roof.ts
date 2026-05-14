import { RbxPart } from '../rbxmx'
import { p } from '../rbxmx'
import { StyleDNA } from '../style/style-dna'
import { BuildPlan } from '../blueprint-compiler'

export function generateRoof(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
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

  for (let f = 0; f < floorCount; f++) {
    const fy = wallBase + f * floorHeight
    const ry = fy + floorHeight
    const pw = tw + 2.5
    const pd = td + 2.5

    if (f > 0) {
      parts.push(p(`Band_F${f}`, tw + 1.5, 2.0, 1.0, tw / 2, fy + 1.0, -0.5, dna.floorBandColor, 'smoothplastic'))
      parts.push(p(`Band_B${f}`, tw + 1.5, 2.0, 1.0, tw / 2, fy + 1.0, td + 0.5, dna.floorBandColor, 'smoothplastic'))
      parts.push(p(`Band_L${f}`, 1.0, 2.0, td + 1.5, -0.5, fy + 1.0, td / 2, dna.floorBandColor, 'smoothplastic'))
      parts.push(p(`Band_R${f}`, 1.0, 2.0, td + 1.5, tw + 0.5, fy + 1.0, td / 2, dna.floorBandColor, 'smoothplastic'))
      parts.push(p(`Drip_F${f}`, tw + 2.0, 0.3, 0.5, tw / 2, fy - 0.15, -0.7, dna.floorBandColor, 'smoothplastic'))
      parts.push(p(`Drip_B${f}`, tw + 2.0, 0.3, 0.5, tw / 2, fy - 0.15, td + 0.7, dna.floorBandColor, 'smoothplastic'))
    }

    parts.push(p(`Pag${f}`, pw, 0.8, pd, tw / 2, ry + 0.4, td / 2, rc, 'smoothplastic'))
    parts.push(p(`PagU${f}`, pw + 0.2, 0.3, pd + 0.2, tw / 2, ry - 0.15, td / 2, rc, 'smoothplastic'))
    parts.push(p(`PagOF${f}`, pw + 2, 0.5, 1.6, tw / 2, ry + 0.1, -1.5, rc, 'smoothplastic'))
    parts.push(p(`PagOB${f}`, pw + 2, 0.5, 1.6, tw / 2, ry + 0.1, td + 1.5, rc, 'smoothplastic'))
    parts.push(p(`PagOL${f}`, 1.6, 0.5, pd + 2, -1.5, ry + 0.1, td / 2, rc, 'smoothplastic'))
    parts.push(p(`PagOR${f}`, 1.6, 0.5, pd + 2, tw + 1.5, ry + 0.1, td / 2, rc, 'smoothplastic'))
    parts.push(p(`PagRidge${f}`, pw - 2, 0.5, 0.6, tw / 2, ry + 1.0, td / 2, rc, 'smoothplastic'))

    const corners: [number, number][] = [[-2, -2], [tw + 2, -2], [-2, td + 2], [tw + 2, td + 2]]
    for (const [ci, [cx2, cz2]] of Array.from(corners.entries())) {
      parts.push(p(`PagC${f}_${ci}`, 1.6, 0.9, 1.6, cx2, ry + 0.6, cz2, rc, 'smoothplastic'))
      parts.push(p(`PagTip${f}_${ci}`, 0.8, 0.5, 0.8, cx2, ry + 1.15, cz2, rc, 'smoothplastic'))
    }
  }

  const topRy = wallBase + floorCount * floorHeight
  parts.push(p('TopRoofCap', tw - 2, 0.6, td - 2, tw / 2, topRy + 1.8, td / 2, rc, 'smoothplastic'))
  parts.push(p('TopRoofRidge', tw - 4, 0.5, 0.6, tw / 2, topRy + 2.1, td / 2, rc, 'smoothplastic'))
  parts.push(p('RoofAC1', 2.5, 1.5, 2.5, tw / 3, topRy + 2.0, td / 3, 'Dark grey', 'smoothplastic'))
  parts.push(p('RoofAC2', 2.5, 1.5, 2.5, tw * 2 / 3, topRy + 2.0, td * 2 / 3, 'Dark grey', 'smoothplastic'))
  parts.push(p('RoofTank', 2.2, 3.0, 2.2, tw / 2, topRy + 3.3, td / 2, 'Medium stone grey', 'smoothplastic'))

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
  return generateGableRoof(plan, dna)
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

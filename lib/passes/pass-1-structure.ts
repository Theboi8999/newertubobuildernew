import { RbxPart } from '../rbxmx'
import { p } from '../rbxmx'
import { StyleDNA } from '../style/style-dna'
import { BuildPlan } from '../blueprint-compiler'

function rustBandColor(ec: string): string {
  if (ec === 'Sand yellow') return 'Brick yellow'
  if (ec === 'White') return 'Light stone grey'
  if (ec === 'Reddish brown') return 'Dark red'
  if (ec === 'Bright green' || ec === 'Medium green') return 'Dark green'
  if (ec === 'Light grey') return 'Medium stone grey'
  return ec
}

export function generateStructure(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, th, wallBase } = plan
  const fh = plan.floorHeight

  parts.push(p('Foundation', tw + 1, wallBase, td + 1, tw / 2, wallBase / 2, td / 2, dna.primaryColor, 'concrete'))
  parts.push(p('Found_Step', tw + 0.4, 0.5, td + 0.4, tw / 2, wallBase + 0.25, td / 2, dna.primaryColor, 'smoothplastic'))

  const wallMat = dna.wallMaterial || 'smoothplastic'
  const mkWall = (name: string, sx: number, sy: number, sz: number, px: number, py: number, pz: number): RbxPart => {
    return p(name, sx, sy, sz, px, py, pz, dna.primaryColor, wallMat)
  }

  // Layer 1 — main wall body (thickness 1.2 via 0.7 + overlap from bands)
  parts.push(mkWall('WallFront', tw, th, 0.7, tw / 2, wallBase + th / 2, 0))
  parts.push(mkWall('WallBack', tw, th, 0.7, tw / 2, wallBase + th / 2, td))
  parts.push(mkWall('WallLeft', 0.7, th, td, 0, wallBase + th / 2, td / 2))
  parts.push(mkWall('WallRight', 0.7, th, td, tw, wallBase + th / 2, td / 2))

  const isAsian = dna.family === 'asian'
  const bandColor = dna.primaryColor
  const rc2 = rustBandColor(dna.primaryColor)

  for (let f = 1; f < plan.floorCount; f++) {
    const fy = wallBase + f * fh

    const slab = p(`FloorSlab_F${f}`, tw - 1, 0.5, td - 1, tw / 2, fy, td / 2, 'Medium stone grey', 'concrete')
    parts.push(slab)

    // Floor bands — 1.8 tall, 1.2 deep proud of wall face
    parts.push(p(`Band_F${f}_Front`, tw + 0.4, 1.8, 1.2, tw / 2, fy + 0.9, -0.6, bandColor, 'smoothplastic'))
    parts.push(p(`Band_F${f}_Back`,  tw + 0.4, 1.8, 1.2, tw / 2, fy + 0.9, td + 0.6, bandColor, 'smoothplastic'))
    parts.push(p(`Band_F${f}_Left`,  1.2, 1.8, td + 0.4, -0.6, fy + 0.9, td / 2, bandColor, 'smoothplastic'))
    parts.push(p(`Band_F${f}_Right`, 1.2, 1.8, td + 0.4, tw + 0.6, fy + 0.9, td / 2, bandColor, 'smoothplastic'))

    // White cap strip on top of each band
    parts.push(p(`BandCap_F${f}_Front`, tw + 0.4, 0.3, 1.3, tw / 2, fy + 1.95, -0.65, 'White', 'smoothplastic'))
    parts.push(p(`BandCap_F${f}_Back`,  tw + 0.4, 0.3, 1.3, tw / 2, fy + 1.95, td + 0.65, 'White', 'smoothplastic'))
    parts.push(p(`BandCap_F${f}_Left`,  1.3, 0.3, td + 0.4, -0.65, fy + 1.95, td / 2, 'White', 'smoothplastic'))
    parts.push(p(`BandCap_F${f}_Right`, 1.3, 0.3, td + 0.4, tw + 0.65, fy + 1.95, td / 2, 'White', 'smoothplastic'))

    // Layer 2 — rustication bands: horizontal proud strips at 10% above floor junction
    const rustY = fy + fh * 0.1
    parts.push(p(`RustF_${f}`, tw + 0.1, 0.6, 0.3, tw / 2, rustY + 0.3, -0.15, rc2, 'smoothplastic'))
    parts.push(p(`RustB_${f}`, tw + 0.1, 0.6, 0.3, tw / 2, rustY + 0.3, td + 0.15, rc2, 'smoothplastic'))
    parts.push(p(`RustL_${f}`, 0.3, 0.6, td + 0.1, -0.15, rustY + 0.3, td / 2, rc2, 'smoothplastic'))
    parts.push(p(`RustR_${f}`, 0.3, 0.6, td + 0.1, tw + 0.15, rustY + 0.3, td / 2, rc2, 'smoothplastic'))
  }

  // Plinth base band at ground level — always wall color
  const plinthColor = dna.primaryColor
  parts.push(p('PlinthBand_F', tw + 0.4, 2.0, 1.0, tw / 2, wallBase + 1.0, -0.5, plinthColor, 'smoothplastic'))
  parts.push(p('PlinthBand_B', tw + 0.4, 2.0, 1.0, tw / 2, wallBase + 1.0, td + 0.5, plinthColor, 'smoothplastic'))
  parts.push(p('PlinthBand_L', 1.0, 2.0, td + 0.4, -0.5, wallBase + 1.0, td / 2, plinthColor, 'smoothplastic'))
  parts.push(p('PlinthBand_R', 1.0, 2.0, td + 0.4, tw + 0.5, wallBase + 1.0, td / 2, plinthColor, 'smoothplastic'))

  // Plinth cap strip — white top edge on each plinth band
  parts.push(p('PlinthCap_F', tw + 0.6, 0.25, 1.2, tw / 2, wallBase + 2.12, -0.6, 'White', 'smoothplastic'))
  parts.push(p('PlinthCap_B', tw + 0.6, 0.25, 1.2, tw / 2, wallBase + 2.12, td + 0.6, 'White', 'smoothplastic'))
  parts.push(p('PlinthCap_L', 1.2, 0.25, td + 0.6, -0.6, wallBase + 2.12, td / 2, 'White', 'smoothplastic'))
  parts.push(p('PlinthCap_R', 1.2, 0.25, td + 0.6, tw + 0.6, wallBase + 2.12, td / 2, 'White', 'smoothplastic'))

  // Foundation corner step blocks
  const fdnCorners: [number, number][] = [[0, 0], [tw, 0], [0, td], [tw, td]]
  for (let fi = 0; fi < fdnCorners.length; fi++) {
    const [fcx, fcz] = fdnCorners[fi]
    parts.push(p(`FdnCorner_${fi}`, 2.0, wallBase + 0.2, 2.0, fcx, (wallBase + 0.2) / 2, fcz, dna.primaryColor, 'concrete'))
  }

  // Corner pilasters — 3.0 wide, white for asian/peranakan
  const pilW = 3.0
  const pilH = th + 1
  const pilColor = isAsian ? 'White' : dna.primaryColor
  for (const [cx, cz] of [[0, 0], [tw, 0], [0, td], [tw, td]] as [number, number][]) {
    parts.push(p(`Pil_${cx}_${cz}`, pilW, pilH, pilW, cx, wallBase + pilH / 2, cz, pilColor, 'smoothplastic'))
    parts.push(p(`PilCap_${cx}_${cz}`, 3.6, 1.2, 3.6, cx, wallBase + pilH + 0.6, cz, dna.trimColor, 'smoothplastic'))
    parts.push(p(`PilBase_${cx}_${cz}`, pilW + 0.8, 1.8, pilW + 0.8, cx, wallBase + 0.9, cz, pilColor, 'smoothplastic'))
  }

  // Layer 3 — quoin stones at corners: alternating proud blocks every 4 studs (every other 2-stud interval)
  const quoinColor = isAsian ? 'White' : dna.family === 'european' ? 'Light stone grey' : dna.primaryColor
  const quoinCorners: [number, number][] = [[0, 0], [tw, 0], [0, td], [tw, td]]
  for (let ci = 0; ci < quoinCorners.length; ci++) {
    const [cx, cz] = quoinCorners[ci]
    for (let qi = 0; qi < 8; qi++) {
      const qy = wallBase + 1.0 + qi * 4.0
      if (qy + 0.9 > wallBase + pilH) break
      parts.push(p(`Quoin_${ci}_${qi}`, 3.2, 1.8, 3.2, cx, qy + 0.9, cz, quoinColor, 'smoothplastic'))
    }
  }

  // Mid-floor accent bands — subtle horizontal groove strip at 2/3 height of each floor
  for (let f = 0; f < plan.floorCount; f++) {
    const midY = wallBase + f * fh + fh * 0.66
    const midColor = dna.trimColor
    parts.push(p(`MidBand_F${f}_Front`, tw + 0.1, 0.3, 0.25, tw / 2, midY, -0.12, midColor, 'smoothplastic'))
    parts.push(p(`MidBand_F${f}_Back`,  tw + 0.1, 0.3, 0.25, tw / 2, midY, td + 0.12, midColor, 'smoothplastic'))
    parts.push(p(`MidBand_F${f}_Left`,  0.25, 0.3, td + 0.1, -0.12, midY, td / 2, midColor, 'smoothplastic'))
    parts.push(p(`MidBand_F${f}_Right`, 0.25, 0.3, td + 0.1, tw + 0.12, midY, td / 2, midColor, 'smoothplastic'))
  }

  // Crown cornice at top of all 4 wall faces — crisp header before roof
  const crownY = wallBase + th
  const crownColor = dna.trimColor
  parts.push(p('Crown_F', tw + 0.6, 1.2, 0.8, tw / 2, crownY + 0.6, -0.4, crownColor, 'smoothplastic'))
  parts.push(p('Crown_B', tw + 0.6, 1.2, 0.8, tw / 2, crownY + 0.6, td + 0.4, crownColor, 'smoothplastic'))
  parts.push(p('Crown_L', 0.8, 1.2, td + 0.6, -0.4, crownY + 0.6, td / 2, crownColor, 'smoothplastic'))
  parts.push(p('Crown_R', 0.8, 1.2, td + 0.6, tw + 0.4, crownY + 0.6, td / 2, crownColor, 'smoothplastic'))
  parts.push(p('CrownCap_F', tw + 0.8, 0.3, 1.0, tw / 2, crownY + 1.35, -0.5, 'White', 'smoothplastic'))
  parts.push(p('CrownCap_B', tw + 0.8, 0.3, 1.0, tw / 2, crownY + 1.35, td + 0.5, 'White', 'smoothplastic'))
  parts.push(p('CrownCap_L', 1.0, 0.3, td + 0.8, -0.5, crownY + 1.35, td / 2, 'White', 'smoothplastic'))
  parts.push(p('CrownCap_R', 1.0, 0.3, td + 0.8, tw + 0.5, crownY + 1.35, td / 2, 'White', 'smoothplastic'))

  // Rainwater downpipes at front two corners
  const dpH = th + wallBase
  parts.push(p('Downpipe_FL', 0.4, dpH, 0.4, 1.5, dpH / 2, -0.2, 'Dark stone grey', 'smoothplastic'))
  parts.push(p('Downpipe_FR', 0.4, dpH, 0.4, tw - 1.5, dpH / 2, -0.2, 'Dark stone grey', 'smoothplastic'))

  return parts
}

import { RbxPart } from '../rbxmx'
import { p } from '../rbxmx'
import { StyleDNA } from '../style/style-dna'
import { BuildPlan } from '../blueprint-compiler'

export type SceneryLevel = 'none' | 'minimal' | 'street' | 'residential' | 'commercial' | 'full'

export function generateTerrain(plan: BuildPlan, dna: StyleDNA, scenery: SceneryLevel): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td } = plan

  if (scenery === 'none') return parts

  parts.push(p('Ground', tw + 20, 1.0, td + 20, tw / 2, 0.1, td / 2, 'Medium stone grey', 'concrete'))

  if (scenery === 'minimal') return parts

  if (['street', 'residential', 'commercial', 'full'].includes(scenery)) {
    parts.push(p('Pavement', tw + 16, 0.8, 14, tw / 2, 0.5, -7, 'Light stone grey', 'concrete'))
    parts.push(p('Road', tw + 80, 0.6, 24, tw / 2, 0.2, -22, 'Dark stone grey', 'concrete'))
    parts.push(p('RoadLine1', tw + 80, 0.65, 0.35, tw / 2, 0.25, -20, 'White', 'smoothplastic'))
    parts.push(p('RoadLine2', tw + 80, 0.65, 0.35, tw / 2, 0.25, -24, 'White', 'smoothplastic'))
    parts.push(p('Kerb', tw + 16, 1.2, 0.5, tw / 2, 0.7, -0.25, 'Medium stone grey', 'concrete'))
  }

  if (scenery === 'street') return parts

  if (['residential', 'full'].includes(scenery)) {
    parts.push(p('FrontLawn', tw + 16, 0.5, 12, tw / 2, 0.3, -13, 'Bright green', 'smoothplastic'))
    parts.push(p('BackYard', tw + 4, 0.5, 20, tw / 2, 0.3, td + 10, 'Bright green', 'smoothplastic'))
    parts.push(p('Driveway', 7, 0.7, 12, tw * 0.2, 0.5, -13, 'Light stone grey', 'concrete'))
    parts.push(p('FrontPath', 2, 0.7, 8, tw / 2, 0.5, -9, 'Light stone grey', 'concrete'))

    const fenceColor = 'Reddish brown'
    const fenceH = 3.5
    const fenceLen = tw + 16
    const postCount = Math.floor(fenceLen / 3)
    for (let fp = 0; fp <= postCount; fp++) {
      const fx = -8 + fp * (fenceLen / postCount)
      parts.push(p(`FPost_${fp}`, 0.4, fenceH, 0.4, fx, 0.5 + fenceH / 2, -14, fenceColor, 'smoothplastic'))
    }
    parts.push(p('FenceRailT', fenceLen, 0.3, 0.2, tw / 2 - 8 + fenceLen / 2, 0.5 + fenceH - 0.3, -14, fenceColor, 'smoothplastic'))
    parts.push(p('FenceRailB', fenceLen, 0.3, 0.2, tw / 2 - 8 + fenceLen / 2, 0.5 + fenceH * 0.4, -14, fenceColor, 'smoothplastic'))
  }

  if (['commercial', 'full'].includes(scenery)) {
    parts.push(p('Carpark', 30, 0.5, 20, tw / 2, 0.3, td + 10, 'Dark stone grey', 'concrete'))
    const spaceCount = 6
    for (let sp = 0; sp < spaceCount; sp++) {
      parts.push(p(`ParkLine_${sp}`, 0.2, 0.6, 6, tw / 2 - 12 + sp * 5, 0.65, td + 8, 'White', 'smoothplastic'))
    }
  }

  if (scenery === 'full') {
    const treeSpots: [number, number][] = [[-7, -9], [tw + 7, -9]]
    for (const [ti, [tx, tz]] of Array.from(treeSpots.entries())) {
      parts.push(p(`Trunk_${ti}`, 1.0, 12, 1.0, tx, 6, tz, 'Reddish brown', 'smoothplastic'))
      parts.push(p(`Can1_${ti}`, 7, 6, 7, tx, 14, tz, 'Bright green', 'smoothplastic'))
      parts.push(p(`Can2_${ti}`, 5, 5, 5, tx + 1, 15.5, tz + 1, 'Medium green', 'smoothplastic'))
      parts.push(p(`Can3_${ti}`, 4, 4, 4, tx - 1, 13, tz - 1, 'Dark green', 'smoothplastic'))
    }
    for (const [li, lx] of [[-6, tw + 6]] as [number, number][]) {
      parts.push(p(`LPost_${li}`, 0.5, 18, 0.5, lx, 9, -8, 'Dark grey', 'smoothplastic'))
      parts.push(p(`LArm_${li}`, 0.2, 0.2, 3.5, lx, 17.2, -6.2, 'Dark grey', 'smoothplastic'))
      parts.push(p(`LHead_${li}`, 1.2, 0.7, 1.8, lx, 17.2, -4.5, 'Bright yellow', 'smoothplastic'))
    }
    parts.push(p('LPost_R', 0.5, 18, 0.5, -6, 9, -8, 'Dark grey', 'smoothplastic'))
    parts.push(p('LArm_R', 0.2, 0.2, 3.5, -6, 17.2, -6.2, 'Dark grey', 'smoothplastic'))
    parts.push(p('LHead_R', 1.2, 0.7, 1.8, -6, 17.2, -4.5, 'Bright yellow', 'smoothplastic'))
    parts.push(p('Bench_S', 4.0, 0.25, 1.0, tw / 2 + 12, 1.5, -8, 'Reddish brown', 'smoothplastic'))
    parts.push(p('Bench_LL', 0.18, 1.5, 1.0, tw / 2 + 10.1, 0.85, -8, 'Dark grey', 'smoothplastic'))
    parts.push(p('Bench_LR', 0.18, 1.5, 1.0, tw / 2 + 13.9, 0.85, -8, 'Dark grey', 'smoothplastic'))
    parts.push(p('Bin', 0.9, 1.4, 0.9, tw / 2 - 12, 0.9, -7, 'Dark grey', 'smoothplastic'))
    parts.push(p('BinLid', 1.1, 0.25, 1.1, tw / 2 - 12, 1.82, -7, 'Really black', 'smoothplastic'))
  }

  return parts
}

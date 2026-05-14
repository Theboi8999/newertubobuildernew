import { RbxPart } from '../rbxmx'
import { p } from '../rbxmx'
import { StyleDNA } from '../style/style-dna'
import { BuildPlan } from '../blueprint-compiler'

export function generateStructure(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, th, wallBase } = plan

  parts.push(p('Foundation', tw + 1, wallBase, td + 1, tw / 2, wallBase / 2, td / 2, dna.primaryColor, 'concrete'))
  parts.push(p('Found_Step', tw + 0.4, 0.5, td + 0.4, tw / 2, wallBase + 0.25, td / 2, dna.primaryColor, 'smoothplastic'))

  parts.push(p('WallFront', tw, th, 0.7, tw / 2, wallBase + th / 2, 0, dna.primaryColor, 'smoothplastic'))
  parts.push(p('WallBack', tw, th, 0.7, tw / 2, wallBase + th / 2, td, dna.primaryColor, 'smoothplastic'))
  parts.push(p('WallLeft', 0.7, th, td, 0, wallBase + th / 2, td / 2, dna.primaryColor, 'smoothplastic'))
  parts.push(p('WallRight', 0.7, th, td, tw, wallBase + th / 2, td / 2, dna.primaryColor, 'smoothplastic'))

  for (let f = 1; f < plan.floorCount; f++) {
    const fy = wallBase + f * plan.floorHeight
    parts.push(p(`FloorSlab_F${f}`, tw - 1, 0.5, td - 1, tw / 2, fy, td / 2, 'Medium stone grey', 'concrete'))
  }

  const pilW = 2.8
  const pilH = th + 1
  for (const [cx, cz] of [[0, 0], [tw, 0], [0, td], [tw, td]] as [number, number][]) {
    parts.push(p(`Pil_${cx}_${cz}`, pilW, pilH, pilW, cx, wallBase + pilH / 2, cz, dna.primaryColor, 'smoothplastic'))
    parts.push(p(`PilCap_${cx}_${cz}`, pilW + 0.5, 0.8, pilW + 0.5, cx, wallBase + pilH + 0.4, cz, dna.trimColor, 'smoothplastic'))
    parts.push(p(`PilBase_${cx}_${cz}`, pilW + 0.8, 1.8, pilW + 0.8, cx, wallBase + 0.9, cz, dna.primaryColor, 'smoothplastic'))
  }

  return parts
}

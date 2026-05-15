import { RbxPart } from '../rbxmx'

export function generateStaircases(
  plan: { tw: number; td: number; floorCount: number; floorHeight: number; wallBase: number },
  enabled: boolean
): RbxPart[] {
  if (!enabled || plan.floorCount <= 1) return []

  const parts: RbxPart[] = []
  const { tw, td, floorCount, floorHeight, wallBase } = plan

  const stairPositions = [
    { sx: tw * 0.2, sz: td * 0.5 },
    { sx: tw * 0.8, sz: td * 0.5 },
  ]

  const stepCount = 12
  const stepRise = floorHeight / stepCount
  const stepRun = 2.0
  const stepWidth = 4.0

  for (let f = 0; f < floorCount - 1; f++) {
    const floorY = wallBase + f * floorHeight

    for (const { sx, sz } of stairPositions) {
      const side = sx > tw / 2 ? 'R' : 'L'

      parts.push({
        name: `Stair_Landing_F${f}_${side}`,
        size: { x: stepWidth + 0.5, y: 0.5, z: stepWidth },
        position: { x: sx, y: floorY + 0.25, z: sz },
        color: 'Light stone grey', material: 'concrete', anchored: true, transparency: 0
      })

      for (let s = 0; s < stepCount; s++) {
        const stepY = floorY + s * stepRise + stepRise / 2
        const stepZ = sz - (stepCount / 2) * stepRun + s * stepRun
        parts.push({
          name: `Stair_Step_F${f}_S${s}_${side}`,
          size: { x: stepWidth, y: stepRise, z: stepRun },
          position: { x: sx, y: stepY, z: stepZ },
          color: 'Light stone grey', material: 'concrete', anchored: true, transparency: 0
        })
      }

      for (const railOffset of [-stepWidth / 2 - 0.1, stepWidth / 2 + 0.1]) {
        const railSide = railOffset > 0 ? 'R' : 'L'
        parts.push({
          name: `Stair_PostBot_F${f}_${side}_${railSide}`,
          size: { x: 0.2, y: floorHeight * 0.5, z: 0.2 },
          position: { x: sx + railOffset, y: floorY + floorHeight * 0.25, z: sz - stepCount * stepRun / 4 },
          color: 'Dark grey', material: 'metal', anchored: true, transparency: 0
        })
        parts.push({
          name: `Stair_PostTop_F${f}_${side}_${railSide}`,
          size: { x: 0.2, y: floorHeight * 0.5, z: 0.2 },
          position: { x: sx + railOffset, y: floorY + floorHeight * 0.75, z: sz + stepCount * stepRun / 4 },
          color: 'Dark grey', material: 'metal', anchored: true, transparency: 0
        })
        parts.push({
          name: `Stair_Rail_F${f}_${side}_${railSide}`,
          size: { x: 0.15, y: 0.15, z: stepCount * stepRun + 1 },
          position: { x: sx + railOffset, y: floorY + floorHeight * 0.6, z: sz },
          color: 'Dark grey', material: 'metal', anchored: true, transparency: 0
        })
      }

      parts.push({
        name: `Stair_LandingTop_F${f}_${side}`,
        size: { x: stepWidth + 0.5, y: 0.5, z: stepWidth },
        position: { x: sx, y: floorY + floorHeight + 0.25, z: sz },
        color: 'Light stone grey', material: 'concrete', anchored: true, transparency: 0
      })
    }
  }

  return parts
}

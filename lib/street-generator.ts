import { RbxPart } from './rbxmx'
import { p } from './rbxmx'

export interface StreetPlot {
  name: string
  x: number
  z: number
  width: number
  depth: number
  buildingType: string
  architecturalStyle?: string
}

export interface StreetConfig {
  name?: string
  plotCount: number
  plotWidth: number
  plotDepth: number
  streetWidth: number
  buildingTypes: string[]
  architecturalStyle?: string
  includeStreetFurniture?: boolean
}

export interface GeneratedStreet {
  plots: StreetPlot[]
  streetParts: RbxPart[]
  totalWidth: number
  totalDepth: number
}

export function generateStreet(config: StreetConfig): GeneratedStreet {
  const {
    plotCount,
    plotWidth,
    plotDepth,
    streetWidth,
    buildingTypes,
    includeStreetFurniture = true,
  } = config

  const streetName = config.name || 'Street'
  const plots: StreetPlot[] = []
  const streetParts: RbxPart[] = []

  const totalLength = plotCount * (plotWidth + 2) + 4
  const totalDepth = plotDepth * 2 + streetWidth + 8
  const streetZ = plotDepth + streetWidth / 2

  // Road surface
  streetParts.push(p(`${streetName}_Road`, totalLength, 0.3, streetWidth, totalLength / 2, -0.15, streetZ, 'Dark stone grey', 'concrete'))

  // Centre line dashes
  const dashCount = Math.floor(totalLength / 6)
  for (let i = 0; i < dashCount; i++) {
    const dx = 3 + i * 6
    streetParts.push(p(`${streetName}_Dash${i}`, 3.5, 0.05, 0.25, dx, 0.03, streetZ, 'White', 'smoothplastic'))
  }

  // Kerbs both sides
  streetParts.push(p(`${streetName}_KerbN`, totalLength, 0.35, 0.6, totalLength / 2, 0.17, streetZ - streetWidth / 2 - 0.3, 'Light stone grey', 'concrete'))
  streetParts.push(p(`${streetName}_KerbS`, totalLength, 0.35, 0.6, totalLength / 2, 0.17, streetZ + streetWidth / 2 + 0.3, 'Light stone grey', 'concrete'))

  // Pavements
  streetParts.push(p(`${streetName}_PavN`, totalLength, 0.25, 4, totalLength / 2, 0.12, streetZ - streetWidth / 2 - 2.3, 'Medium stone grey', 'concrete'))
  streetParts.push(p(`${streetName}_PavS`, totalLength, 0.25, 4, totalLength / 2, 0.12, streetZ + streetWidth / 2 + 2.3, 'Medium stone grey', 'concrete'))

  // Street furniture
  if (includeStreetFurniture) {
    const lampPostCount = Math.floor(plotCount / 2) + 1
    for (let i = 0; i <= lampPostCount; i++) {
      const lx = 2 + i * (totalLength / lampPostCount)
      // North side lamp post
      streetParts.push(p(`${streetName}_LampPoleN${i}`, 0.3, 8, 0.3, lx, 4, streetZ - streetWidth / 2 - 1.5, 'Dark stone grey', 'metal'))
      streetParts.push(p(`${streetName}_LampArmN${i}`, 2.5, 0.2, 0.2, lx + 1.25, 8.1, streetZ - streetWidth / 2 - 1.5, 'Dark stone grey', 'metal'))
      streetParts.push(p(`${streetName}_LampN${i}`, 0.8, 0.35, 0.8, lx + 2.5, 7.95, streetZ - streetWidth / 2 - 1.5, 'Bright yellow', 'neon', 0, true))
      // South side lamp post
      streetParts.push(p(`${streetName}_LampPoleS${i}`, 0.3, 8, 0.3, lx, 4, streetZ + streetWidth / 2 + 1.5, 'Dark stone grey', 'metal'))
      streetParts.push(p(`${streetName}_LampArmS${i}`, 2.5, 0.2, 0.2, lx - 1.25, 8.1, streetZ + streetWidth / 2 + 1.5, 'Dark stone grey', 'metal'))
      streetParts.push(p(`${streetName}_LampS${i}`, 0.8, 0.35, 0.8, lx - 2.5, 7.95, streetZ + streetWidth / 2 + 1.5, 'Bright yellow', 'neon', 0, true))
    }

    // Trees along north pavement
    const treeCount = Math.max(2, Math.floor(plotCount * 0.6))
    for (let i = 0; i < treeCount; i++) {
      const tx = 4 + (i / Math.max(1, treeCount - 1)) * (totalLength - 8)
      streetParts.push(p(`${streetName}_TreeTrunkN${i}`, 0.7, 4, 0.7, tx, 2, streetZ - streetWidth / 2 - 3.5, 'Reddish brown', 'wood'))
      streetParts.push(p(`${streetName}_TreeCanopyN${i}`, 4, 4, 4, tx, 7, streetZ - streetWidth / 2 - 3.5, 'Dark green', 'concrete'))
    }
  }

  // Generate plot definitions (north side)
  for (let i = 0; i < plotCount; i++) {
    const px = 2 + plotWidth / 2 + i * (plotWidth + 2)
    const pz = plotDepth / 2
    const bType = buildingTypes[i % buildingTypes.length]
    plots.push({
      name: `Plot_N${i}`,
      x: px,
      z: pz,
      width: plotWidth,
      depth: plotDepth,
      buildingType: bType,
      architecturalStyle: config.architecturalStyle,
    })
  }

  // Generate plot definitions (south side)
  for (let i = 0; i < plotCount; i++) {
    const px = 2 + plotWidth / 2 + i * (plotWidth + 2)
    const pz = streetZ + streetWidth / 2 + 4 + plotDepth / 2
    const bType = buildingTypes[(i + Math.floor(plotCount / 2)) % buildingTypes.length]
    plots.push({
      name: `Plot_S${i}`,
      x: px,
      z: pz,
      width: plotWidth,
      depth: plotDepth,
      buildingType: bType,
      architecturalStyle: config.architecturalStyle,
    })
  }

  return { plots, streetParts, totalWidth: totalLength, totalDepth }
}

import { RbxPart } from './rbxmx'
import { p } from './rbxmx'
import { BuildPlan } from './blueprint-compiler'
import { StyleDNA } from './style/style-dna'

export type Climate = 'tropical' | 'temperate' | 'cold' | 'arid' | 'mediterranean'

export interface ClimateProfile {
  climate: Climate
  colonnadeDepthBonus: number
  windowSizeFactor: number
  roofOverhangBonus: number
  wallThicknessFactor: number
  hasChimney: boolean
  chimneyColor: string
}

export const CLIMATE_PROFILES: Record<Climate, ClimateProfile> = {
  tropical: {
    climate: 'tropical',
    colonnadeDepthBonus: 2,
    windowSizeFactor: 1.15,
    roofOverhangBonus: 1.5,
    wallThicknessFactor: 1.0,
    hasChimney: false,
    chimneyColor: 'Reddish brown',
  },
  temperate: {
    climate: 'temperate',
    colonnadeDepthBonus: 0,
    windowSizeFactor: 1.0,
    roofOverhangBonus: 0,
    wallThicknessFactor: 1.0,
    hasChimney: false,
    chimneyColor: 'Reddish brown',
  },
  cold: {
    climate: 'cold',
    colonnadeDepthBonus: 0,
    windowSizeFactor: 0.8,
    roofOverhangBonus: 0.5,
    wallThicknessFactor: 1.2,
    hasChimney: true,
    chimneyColor: 'Reddish brown',
  },
  arid: {
    climate: 'arid',
    colonnadeDepthBonus: 1,
    windowSizeFactor: 0.7,
    roofOverhangBonus: 0,
    wallThicknessFactor: 1.1,
    hasChimney: false,
    chimneyColor: 'Light stone grey',
  },
  mediterranean: {
    climate: 'mediterranean',
    colonnadeDepthBonus: 1,
    windowSizeFactor: 1.0,
    roofOverhangBonus: 0.5,
    wallThicknessFactor: 1.0,
    hasChimney: false,
    chimneyColor: 'Light stone grey',
  },
}

const TROPICAL_KEYWORDS = ['peranakan', 'colonial', 'singapore', 'tropical', 'southeast', 'shophouse', 'chinese', 'malay', 'thai', 'indonesian', 'vietnamese']
const COLD_KEYWORDS = ['scandinavian', 'nordic', 'alpine', 'russian', 'norwegian', 'swedish', 'finnish', 'swiss', 'bavarian']
const ARID_KEYWORDS = ['islamic', 'mosque', 'arabic', 'middle eastern', 'moroccan', 'saharan', 'desert']
const MEDITERRANEAN_KEYWORDS = ['mediterranean', 'spanish', 'italian', 'greek', 'portuguese', 'villa', 'tuscan']

export function detectClimate(architecturalStyle: string, buildingType: string): Climate {
  const search = (architecturalStyle + ' ' + buildingType).toLowerCase()
  if (TROPICAL_KEYWORDS.some(k => search.includes(k))) return 'tropical'
  if (COLD_KEYWORDS.some(k => search.includes(k))) return 'cold'
  if (ARID_KEYWORDS.some(k => search.includes(k))) return 'arid'
  if (MEDITERRANEAN_KEYWORDS.some(k => search.includes(k))) return 'mediterranean'
  return 'temperate'
}

export function applyClimateToDNA(dna: StyleDNA, profile: ClimateProfile): void {
  if (profile.colonnadeDepthBonus > 0) {
    dna.colonnadeDepth = (dna.colonnadeDepth || 4) + profile.colonnadeDepthBonus
  }
  dna.roofOverhang = Math.max(dna.roofOverhang || 1.5, (dna.roofOverhang || 1.5) + profile.roofOverhangBonus)
}

export function generateChimneyStacks(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, th } = plan
  const baseY = wallBase + th
  const chimneyH = 4.5
  const capColor = 'Dark grey'
  const stackColor = dna.primaryColor === 'Reddish brown' ? 'Reddish brown' : 'Reddish brown'

  // Two chimney stacks symmetrically placed near roof ridge
  const positions: [number, number][] = [
    [tw * 0.25, td * 0.45],
    [tw * 0.75, td * 0.45],
  ]

  for (let ci = 0; ci < positions.length; ci++) {
    const [cx, cz] = positions[ci]
    parts.push(p(`Chimney_${ci}`, 1.2, chimneyH, 1.2, cx, baseY + chimneyH / 2, cz, stackColor, 'brick'))
    parts.push(p(`ChimneyCap_${ci}`, 1.6, 0.35, 1.6, cx, baseY + chimneyH + 0.17, cz, capColor, 'concrete'))
    parts.push(p(`ChimneyPot_${ci}A`, 0.45, 0.9, 0.45, cx - 0.25, baseY + chimneyH + 0.8, cz, stackColor, 'brick'))
    parts.push(p(`ChimneyPot_${ci}B`, 0.45, 0.9, 0.45, cx + 0.25, baseY + chimneyH + 0.8, cz, stackColor, 'brick'))
  }

  return parts
}

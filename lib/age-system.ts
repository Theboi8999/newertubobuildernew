import { RbxPart } from './rbxmx'
import { p } from './rbxmx'

export type AgeTier = 'new' | 'aged' | 'weathered' | 'ruined'

export interface AgeProfile {
  tier: AgeTier
  yearsOld: number
  crackDensity: number
  stainIntensity: number
  vegetationLevel: number
  hasGraffiti: boolean
  colorFadeAmount: number
}

export const AGE_PROFILES: Record<AgeTier, AgeProfile> = {
  new: {
    tier: 'new',
    yearsOld: 0,
    crackDensity: 0,
    stainIntensity: 0,
    vegetationLevel: 0,
    hasGraffiti: false,
    colorFadeAmount: 0,
  },
  aged: {
    tier: 'aged',
    yearsOld: 30,
    crackDensity: 0.2,
    stainIntensity: 0.3,
    vegetationLevel: 0.1,
    hasGraffiti: false,
    colorFadeAmount: 0.1,
  },
  weathered: {
    tier: 'weathered',
    yearsOld: 80,
    crackDensity: 0.5,
    stainIntensity: 0.6,
    vegetationLevel: 0.3,
    hasGraffiti: true,
    colorFadeAmount: 0.25,
  },
  ruined: {
    tier: 'ruined',
    yearsOld: 150,
    crackDensity: 0.9,
    stainIntensity: 0.9,
    vegetationLevel: 0.7,
    hasGraffiti: true,
    colorFadeAmount: 0.5,
  },
}

export function detectAgeTier(yearsOld: number): AgeTier {
  if (yearsOld >= 100) return 'ruined'
  if (yearsOld >= 50) return 'weathered'
  if (yearsOld >= 15) return 'aged'
  return 'new'
}

function fadeColor(color: string, amount: number): string {
  if (amount <= 0) return color
  const FADED: Record<string, string> = {
    'Bright red':      amount > 0.3 ? 'Rust' : 'Dark red',
    'Bright green':    amount > 0.3 ? 'Sand green' : 'Dark green',
    'Bright blue':     amount > 0.3 ? 'Sand blue' : 'Navy blue',
    'Sand yellow':     amount > 0.3 ? 'Brick yellow' : 'Sand yellow',
    'White':           amount > 0.3 ? 'Light stone grey' : 'White',
    'Cashmere':        amount > 0.3 ? 'Light stone grey' : 'Cashmere',
  }
  return FADED[color] ?? color
}

export function applyAgeToColor(color: string, profile: AgeProfile): string {
  return fadeColor(color, profile.colorFadeAmount)
}

export function generateAgeDecals(
  name: string,
  tw: number,
  td: number,
  wallBase: number,
  th: number,
  profile: AgeProfile
): RbxPart[] {
  const parts: RbxPart[] = []
  if (profile.tier === 'new') return parts

  // Water stains below windowsills — front face
  if (profile.stainIntensity > 0.2) {
    const stainCount = Math.max(1, Math.round(tw / 10 * profile.stainIntensity))
    for (let i = 0; i < stainCount; i++) {
      const sx = (tw / (stainCount + 1)) * (i + 1)
      const sy = wallBase + th * 0.55
      parts.push(p(`${name}_Stain${i}`, 0.8, th * 0.2, 0.05, sx, sy, -0.4, 'Dark stone grey', 'smoothplastic', 0.6))
    }
  }

  // Cracks — front face
  if (profile.crackDensity > 0.3) {
    const crackCount = Math.max(1, Math.round(tw / 8 * profile.crackDensity))
    for (let i = 0; i < crackCount; i++) {
      const cx = (tw / (crackCount + 1)) * (i + 1)
      const cy = wallBase + th * 0.3 + i * (th / crackCount) * 0.4
      parts.push(p(`${name}_Crack${i}`, 0.12, th * 0.3, 0.08, cx, cy, -0.38, 'Really black', 'smoothplastic', 0.4))
    }
  }

  // Vegetation — moss/vine strip at base
  if (profile.vegetationLevel > 0.1) {
    const vegH = Math.max(1, th * 0.08 * profile.vegetationLevel)
    parts.push(p(`${name}_VegF`, tw, vegH, 0.15, tw / 2, wallBase + vegH / 2, -0.37, 'Dark green', 'concrete', 0.3))
    parts.push(p(`${name}_VegB`, tw, vegH, 0.15, tw / 2, wallBase + vegH / 2, td + 0.37, 'Dark green', 'concrete', 0.3))
  }

  // Graffiti — single coloured band low on front wall
  if (profile.hasGraffiti) {
    parts.push(p(`${name}_Graffiti`, tw * 0.35, 2.5, 0.06, tw * 0.4, wallBase + 2.5, -0.37, 'Bright orange', 'smoothplastic', 0.2))
  }

  return parts
}

export function parseAgeTier(input: string | undefined): AgeTier {
  if (input === 'new' || input === 'aged' || input === 'weathered' || input === 'ruined') return input
  return 'new'
}

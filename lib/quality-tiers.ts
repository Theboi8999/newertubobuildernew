export type QualityTier = 'fast' | 'standard' | 'prestige'

export interface TierConfig {
  tier: QualityTier
  maxParts: number
  furnitureEnabled: boolean
  sceneryLevel: 'none' | 'minimal' | 'standard' | 'rich'
  hasStaircases: boolean
  detailMultiplier: number
  aiResearchEnabled: boolean
  description: string
}

export const TIER_CONFIGS: Record<QualityTier, TierConfig> = {
  fast: {
    tier: 'fast',
    maxParts: 400,
    furnitureEnabled: false,
    sceneryLevel: 'none',
    hasStaircases: false,
    detailMultiplier: 0.5,
    aiResearchEnabled: false,
    description: 'Quick preview — golden specs only, no scenery, no furniture',
  },
  standard: {
    tier: 'standard',
    maxParts: 1200,
    furnitureEnabled: false,
    sceneryLevel: 'minimal',
    hasStaircases: true,
    detailMultiplier: 1.0,
    aiResearchEnabled: true,
    description: 'Full build — all passes, minimal scenery, no furniture',
  },
  prestige: {
    tier: 'prestige',
    maxParts: 4000,
    furnitureEnabled: true,
    sceneryLevel: 'rich',
    hasStaircases: true,
    detailMultiplier: 1.5,
    aiResearchEnabled: true,
    description: 'Maximum detail — furniture, rich scenery, full passes',
  },
}

export function getTierConfig(tier: QualityTier): TierConfig {
  return TIER_CONFIGS[tier]
}

export function parseTier(input: string | undefined): QualityTier {
  if (input === 'fast' || input === 'standard' || input === 'prestige') return input
  return 'standard'
}

export function tierToOptions(config: TierConfig): {
  furniture: boolean
  scenery: string
  hasStaircases: boolean
} {
  return {
    furniture: config.furnitureEnabled,
    scenery: config.sceneryLevel,
    hasStaircases: config.hasStaircases,
  }
}

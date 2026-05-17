import { StyleDNA } from './style/style-dna'
import { Climate } from './climate-profiles'
import { AgeTier } from './age-system'
import { QualityTier } from './quality-tiers'

export interface StyleBoardEntry {
  color: string
  label: string
  role: 'primary' | 'trim' | 'roof' | 'accent' | 'ground'
}

export interface StyleBoard {
  buildingType: string
  architecturalStyle: string
  palette: StyleBoardEntry[]
  climate: Climate
  ageTier: AgeTier
  qualityTier: QualityTier
  facadeGrammar: string
  roofType: string
  hasColonnade: boolean
  hasChimney: boolean
  moodKeywords: string[]
  generatedAt: string
}

function climateToMood(climate: Climate): string[] {
  switch (climate) {
    case 'tropical':     return ['lush', 'vibrant', 'humid', 'verdant']
    case 'cold':         return ['stark', 'minimal', 'hardy', 'monochrome']
    case 'arid':         return ['dry', 'sun-bleached', 'earthy', 'desert']
    case 'mediterranean': return ['warm', 'terracotta', 'sun-drenched', 'rustic']
    default:             return ['temperate', 'balanced', 'neutral']
  }
}

function ageTierToMood(age: AgeTier): string[] {
  switch (age) {
    case 'new':       return ['pristine', 'crisp', 'contemporary']
    case 'aged':      return ['patinated', 'lived-in', 'character']
    case 'weathered': return ['worn', 'storied', 'time-marked']
    case 'ruined':    return ['decayed', 'overgrown', 'haunting']
  }
}

export function buildStyleBoard(params: {
  dna: StyleDNA
  buildingType: string
  architecturalStyle: string
  climate: Climate
  ageTier: AgeTier
  qualityTier: QualityTier
  hasChimney: boolean
}): StyleBoard {
  const { dna, buildingType, architecturalStyle, climate, ageTier, qualityTier, hasChimney } = params

  const palette: StyleBoardEntry[] = [
    { color: dna.primaryColor, label: 'Wall / Body', role: 'primary' },
    { color: dna.trimColor, label: 'Trim / Cornice', role: 'trim' },
    { color: dna.roofColor, label: 'Roof', role: 'roof' },
  ]

  if (dna.accentColor && dna.accentColor !== dna.primaryColor) {
    palette.push({ color: dna.accentColor, label: 'Accent', role: 'accent' })
  }

  if (dna.groundColor) {
    palette.push({ color: dna.groundColor, label: 'Ground', role: 'ground' })
  }

  const moodKeywords = [
    ...climateToMood(climate),
    ...ageTierToMood(ageTier),
    architecturalStyle.split(' ')[0],
  ]

  return {
    buildingType,
    architecturalStyle,
    palette,
    climate,
    ageTier,
    qualityTier,
    facadeGrammar: dna.facadeGrammar || '',
    roofType: dna.roofType || 'flat',
    hasColonnade: dna.hasColonnade || false,
    hasChimney,
    moodKeywords,
    generatedAt: new Date().toISOString(),
  }
}

export function styleBoardToMarkdown(board: StyleBoard): string {
  const lines: string[] = [
    `# Style Board — ${board.buildingType}`,
    '',
    `**Style:** ${board.architecturalStyle}`,
    `**Climate:** ${board.climate}  **Age:** ${board.ageTier}  **Quality:** ${board.qualityTier}`,
    `**Roof:** ${board.roofType}  **Colonnade:** ${board.hasColonnade ? 'yes' : 'no'}  **Chimney:** ${board.hasChimney ? 'yes' : 'no'}`,
    '',
    '## Palette',
  ]

  for (const entry of board.palette) {
    lines.push(`- **${entry.label}** (${entry.role}): \`${entry.color}\``)
  }

  lines.push('')
  lines.push('## Facade Grammar')
  lines.push(`\`${board.facadeGrammar || 'default'}\``)
  lines.push('')
  lines.push('## Mood')
  lines.push(board.moodKeywords.join(', '))

  return lines.join('\n')
}

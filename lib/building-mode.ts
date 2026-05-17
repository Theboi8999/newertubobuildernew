export type BuildingMode = 'residential' | 'shophouse' | 'civic' | 'religious' | 'industrial' | 'generic'

const MODE_KEYWORDS: Record<BuildingMode, string[]> = {
  residential: ['house','home','villa','bungalow','cottage','townhouse','duplex','residential','dwelling','manor','cabin','chalet','australian','suburban'],
  shophouse: ['shophouse','peranakan','chinese colonial','five foot way','singaporean shop','heritage shop','colonial shop'],
  civic: ['hospital','police','fire station','courthouse','parliament','school','library','museum','city hall','town hall','government','university','college','station','prison','jail','embassy','consulate','barracks','military'],
  religious: ['church','mosque','temple','cathedral','chapel','synagogue','monastery','shrine','pagoda','masjid','basilica'],
  industrial: ['warehouse','factory','depot','hangar','workshop','plant','facility','industrial','storage','distribution'],
  generic: []
}

const FAMILY_TO_MODE: Record<string, BuildingMode> = {
  residential: 'residential',
  shophouse: 'shophouse',
  peranakan: 'shophouse',
  civic: 'civic',
  government: 'civic',
  religious: 'religious',
  industrial: 'industrial',
  commercial: 'generic',
  generic: 'generic'
}

export function detectMode(
  r: { buildingType?: string; architecturalStyle?: string },
  dna?: { family?: string }
): BuildingMode {
  if (dna?.family) {
    const mapped = FAMILY_TO_MODE[dna.family.toLowerCase()]
    if (mapped) return mapped
  }

  const haystack = `${r.buildingType || ''} ${r.architecturalStyle || ''}`.toLowerCase()

  for (const mode of ['shophouse','civic','religious','industrial','residential'] as BuildingMode[]) {
    const keywords = MODE_KEYWORDS[mode]
    if (keywords.some(kw => haystack.includes(kw))) return mode
  }

  return 'generic'
}

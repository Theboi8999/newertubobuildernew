export interface ReferenceImage {
  url: string
  title: string
  source: string
  relevanceScore: number
  tags: string[]
}

export interface ReferenceSearchResult {
  buildingType: string
  architecturalStyle: string
  images: ReferenceImage[]
  searchQuery: string
}

const STYLE_REFERENCE_TAGS: Record<string, string[]> = {
  peranakan:     ['peranakan shophouse', 'singapore heritage', 'straits chinese', 'colorful facade'],
  victorian:     ['victorian terrace', 'bay window', 'sash window', 'brick facade'],
  islamic:       ['mosque architecture', 'dome', 'minaret', 'islamic geometric'],
  gothic:        ['gothic church', 'pointed arch', 'flying buttress', 'stone tracery'],
  neoclassical:  ['neoclassical columns', 'portico', 'pediment', 'pilasters'],
  colonial:      ['colonial architecture', 'verandah', 'louvred shutters', 'white facade'],
  scandinavian:  ['nordic architecture', 'timber cladding', 'steep roof', 'minimal facade'],
  modern:        ['modern architecture', 'glass facade', 'flat roof', 'minimalist'],
  mediterranean: ['mediterranean villa', 'terracotta roof', 'white stucco', 'arched windows'],
  arabic:        ['arabic architecture', 'mashrabiya', 'courtyard', 'ornamental'],
}

function buildSearchQuery(buildingType: string, architecturalStyle: string): string {
  const parts: string[] = []
  const style = architecturalStyle.toLowerCase()
  const type = buildingType.toLowerCase().replace(/_/g, ' ')

  for (const [key, tags] of Object.entries(STYLE_REFERENCE_TAGS)) {
    if (style.includes(key) || type.includes(key)) {
      parts.push(tags[0])
      break
    }
  }

  if (parts.length === 0) {
    parts.push(type + ' building exterior')
  } else {
    parts.push(type)
  }

  return parts.join(' ')
}

function deriveTagsFromStyle(architecturalStyle: string, buildingType: string): string[] {
  const tags: string[] = []
  const combined = (architecturalStyle + ' ' + buildingType).toLowerCase()

  for (const [key, styleTags] of Object.entries(STYLE_REFERENCE_TAGS)) {
    if (combined.includes(key)) {
      for (let i = 0; i < styleTags.length; i++) {
        tags.push(styleTags[i])
      }
    }
  }

  return tags.length > 0 ? tags : ['building exterior', 'architecture', buildingType]
}

export function buildReferenceSearchQuery(buildingType: string, architecturalStyle: string): string {
  return buildSearchQuery(buildingType, architecturalStyle)
}

export function scoreReferenceRelevance(image: { title: string; tags?: string[] }, buildingType: string, architecturalStyle: string): number {
  const combined = (architecturalStyle + ' ' + buildingType).toLowerCase()
  const titleLower = (image.title || '').toLowerCase()
  let score = 0

  const words = combined.split(/\s+/)
  for (const word of words) {
    if (word.length > 3 && titleLower.includes(word)) score += 10
  }

  const imgTags = image.tags || []
  for (const tag of imgTags) {
    if (combined.includes(tag.toLowerCase())) score += 5
  }

  return Math.min(100, score)
}

export function createMockReferenceResult(buildingType: string, architecturalStyle: string): ReferenceSearchResult {
  const query = buildSearchQuery(buildingType, architecturalStyle)
  const tags = deriveTagsFromStyle(architecturalStyle, buildingType)

  const images: ReferenceImage[] = [
    {
      url: '',
      title: `${architecturalStyle} ${buildingType} exterior`,
      source: 'reference-library',
      relevanceScore: 90,
      tags,
    },
    {
      url: '',
      title: `${buildingType} facade detail`,
      source: 'reference-library',
      relevanceScore: 75,
      tags: tags.slice(0, 2),
    },
  ]

  return { buildingType, architecturalStyle, images, searchQuery: query }
}

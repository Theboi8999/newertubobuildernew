export interface BuildIntent {
  rawPrompt: string
  buildingType: string
  style: 'realistic' | 'stylized' | 'cartoony'
  scale: 'small' | 'medium' | 'large'
  floorCount: number
  mode: 'exterior' | 'full'
  scenery: 'none' | 'minimal' | 'street' | 'residential' | 'commercial' | 'full'
  furniture: 'none' | 'simple' | 'full'
  hasStaircases: boolean
  hasCeiling: boolean
  purpose: 'gameplay' | 'decoration' | 'showcase'
  region: string
  era: string
  specialRequests: string[]
  complete: boolean
  confidence: number
  questionsAsked: number
}

export function createDefaultIntent(prompt: string): BuildIntent {
  return {
    rawPrompt: prompt,
    buildingType: '',
    style: 'realistic',
    scale: 'medium',
    floorCount: 3,
    mode: 'exterior',
    scenery: 'minimal',
    furniture: 'simple',
    hasStaircases: true,
    hasCeiling: true,
    purpose: 'decoration',
    region: '',
    era: '',
    specialRequests: [],
    complete: false,
    confidence: 0,
    questionsAsked: 0,
  }
}

export function isIntentComplete(intent: BuildIntent): boolean {
  const hasStyle = intent.rawPrompt.match(/realistic|stylized|cartoony/i)
  const hasScale = intent.rawPrompt.match(/floor|storey|story|big|small|large|tiny/i)
  const hasMode = intent.rawPrompt.match(/interior|inside|full|exterior|outside/i)

  if (hasStyle && hasScale && hasMode) return true
  if (intent.questionsAsked >= 3) return true

  return intent.style !== undefined &&
    intent.floorCount > 0 &&
    intent.mode !== undefined
}

export function getNextQuestion(intent: BuildIntent): {
  question: string
  options: string[]
  field: keyof BuildIntent
} | null {
  if (!intent.style && intent.questionsAsked < 3) {
    return {
      question: 'Is this for a realistic game or more stylized/cartoony?',
      options: ['Realistic', 'Stylized', 'Cartoony'],
      field: 'style',
    }
  }
  if (!intent.floorCount && intent.questionsAsked < 3) {
    return {
      question: 'How many floors?',
      options: ['1-2 floors', '3-4 floors', '5+ floors'],
      field: 'floorCount',
    }
  }
  if (!intent.mode && intent.questionsAsked < 3) {
    return {
      question: 'Exterior only or full building with interior?',
      options: ['Exterior only', 'Full building'],
      field: 'mode',
    }
  }
  return null
}

export function estimateGeneration(intent: BuildIntent): {
  parts: number
  seconds: number
  description: string
} {
  let parts = 200
  let seconds = 15

  if (intent.mode === 'full') { parts += 300; seconds += 25 }

  const sceneryParts: Record<string, number> = {
    none: 0, minimal: 20, street: 60,
    residential: 120, commercial: 100, full: 250,
  }
  const scenerySecs: Record<string, number> = {
    none: 0, minimal: 2, street: 5,
    residential: 8, commercial: 8, full: 15,
  }
  parts += sceneryParts[intent.scenery] || 0
  seconds += scenerySecs[intent.scenery] || 0

  if (intent.furniture === 'full') { parts += 100; seconds += 10 }
  if (intent.hasStaircases) { parts += 50; seconds += 5 }

  return {
    parts,
    seconds,
    description: `~${parts} parts · ~${seconds}s`,
  }
}

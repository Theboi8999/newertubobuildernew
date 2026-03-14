import { BUILDING_KNOWLEDGE } from './building'
import { SCRIPTING_KNOWLEDGE, ADVANCED_SCRIPTING_KNOWLEDGE, WEAPON_SCRIPTING_KNOWLEDGE, HELICOPTER_COPILOT_KNOWLEDGE, NAVY_SHIP_KNOWLEDGE, FIRE_TRUCK_KNOWLEDGE, FIRE_SYSTEM_KNOWLEDGE } from './scripting'
import { VEHICLE_KNOWLEDGE } from './vehicles'
import { MAP_KNOWLEDGE } from './maps'
import { VEHICLE_SCRIPTING_KNOWLEDGE } from './scripting-vehicles'
import { MEDICAL_SCRIPTING_KNOWLEDGE } from './scripting-medical'
import { LAW_SCRIPTING_KNOWLEDGE } from './scripting-law'
import { BUILDING_SCRIPTING_KNOWLEDGE } from './scripting-building'
import { ECONOMY_SCRIPTING_KNOWLEDGE } from './scripting-economy'
import { UI_SCRIPTING_KNOWLEDGE } from './scripting-ui'
import { NPC_SCRIPTING_KNOWLEDGE } from './scripting-npc'
import { ADVANCED_SYSTEM_KNOWLEDGE } from './scripting-advanced'

export type SystemType = 'builder' | 'modeling' | 'project'

// ── Keyword → Module mapping ──────────────────────────────────────────────
const KEYWORD_MODULES: Array<{ keywords: string[]; module: string; knowledge: string }> = [
  // Vehicles
  { keywords: ['helicopter','chopper','heli','rotor','aircraft'], module: 'helicopter', knowledge: HELICOPTER_COPILOT_KNOWLEDGE },
  { keywords: ['ship','boat','navy','vessel','destroyer','frigate','carrier'], module: 'ship', knowledge: NAVY_SHIP_KNOWLEDGE },
  { keywords: ['fire truck','ladder truck','pumper','appliance','apparatus'], module: 'firetruck', knowledge: FIRE_TRUCK_KNOWLEDGE },
  { keywords: ['car','vehicle','van','suv','sedan','motorcycle','bike','train','tram','forklift'], module: 'vehicles', knowledge: VEHICLE_SCRIPTING_KNOWLEDGE },

  // Weapons & combat
  { keywords: ['missile','rocket','launcher','torpedo','mortar'], module: 'missile', knowledge: ADVANCED_SCRIPTING_KNOWLEDGE },
  { keywords: ['gun','rifle','pistol','shotgun','weapon','firearm','m4','ak','mp5','glock'], module: 'weapons', knowledge: WEAPON_SCRIPTING_KNOWLEDGE },

  // Medical
  { keywords: ['injury','bleed','wound','medical','ambulance','paramedic','stretcher','defib','hospital','hurt','health'], module: 'medical', knowledge: MEDICAL_SCRIPTING_KNOWLEDGE },
  { keywords: ['hunger','thirst','food','drink','stamina','fatigue','drug','alcohol','drunk'], module: 'needs', knowledge: MEDICAL_SCRIPTING_KNOWLEDGE },

  // Law enforcement
  { keywords: ['handcuff','arrest','detain','suspect','booking','charge','custody','prison','cell','jail'], module: 'arrest', knowledge: LAW_SCRIPTING_KNOWLEDGE },
  { keywords: ['radio','dispatch','cad','wanted','warrant','evidence','breathalyser','speed camera'], module: 'law', knowledge: LAW_SCRIPTING_KNOWLEDGE },

  // Fire system
  { keywords: ['fire','flame','smoke','blaze','arson','burn','extinguish','hose','sprinkler'], module: 'fire', knowledge: FIRE_SYSTEM_KNOWLEDGE },

  // Buildings
  { keywords: ['door','keycard','lock','elevator','lift','garage door','alarm','camera feed','security camera','weather','rain','storm','destructible'], module: 'building_scripts', knowledge: BUILDING_SCRIPTING_KNOWLEDGE },

  // Economy
  { keywords: ['money','currency','cash','shop','buy','sell','inventory','locker','uniform','clothes','job','whitelist','paycheck','salary','economy'], module: 'economy', knowledge: ECONOMY_SCRIPTING_KNOWLEDGE },

  // UI
  { keywords: ['hud','speedometer','minimap','radar','compass','notification','toast','loading screen','admin panel','leaderboard','ui','gui'], module: 'ui', knowledge: UI_SCRIPTING_KNOWLEDGE },

  // NPC
  { keywords: ['npc','civilian','crowd','pedestrian','traffic','shopkeeper','criminal npc','ai','pathfinding'], module: 'npc', knowledge: NPC_SCRIPTING_KNOWLEDGE },

  // Advanced
  { keywords: ['datastore','save','data','profileservice','persistent','ragdoll','anti-cheat','team','cutscene','cinematic'], module: 'advanced', knowledge: ADVANCED_SYSTEM_KNOWLEDGE },
]

function detectRequiredModules(prompt: string): string[] {
  const lower = prompt.toLowerCase()
  const modules: Set<string> = new Set()

  for (const entry of KEYWORD_MODULES) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        modules.add(entry.module)
        break
      }
    }
  }

  return Array.from(modules)
}

function getScriptingKnowledge(prompt: string, systemType: SystemType): string {
  const lower = prompt.toLowerCase()
  const parts: string[] = [SCRIPTING_KNOWLEDGE]
  const loaded: Set<string> = new Set()

  for (const entry of KEYWORD_MODULES) {
    let match = false
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) { match = true; break }
    }
    if (match && !loaded.has(entry.module)) {
      parts.push(entry.knowledge)
      loaded.add(entry.module)
    }
  }

  // Always load vehicle scripting for modeling system
  if (systemType === 'modeling' && !loaded.has('vehicles')) {
    parts.push(VEHICLE_SCRIPTING_KNOWLEDGE)
  }

  // Always load building scripts for builder system
  if (systemType === 'builder' && !loaded.has('building_scripts')) {
    parts.push(BUILDING_SCRIPTING_KNOWLEDGE)
  }

  return parts.join('\n\n')
}

export function getKnowledgeForSystem(systemType: SystemType, prompt?: string): string {
  const baseKnowledge = {
    builder: BUILDING_KNOWLEDGE,
    modeling: VEHICLE_KNOWLEDGE,
    project: `${MAP_KNOWLEDGE}\n\n${BUILDING_KNOWLEDGE}\n\n${VEHICLE_KNOWLEDGE}`,
  }[systemType]

  const scriptingKnowledge = getScriptingKnowledge(prompt || '', systemType)

  const detectedModules = prompt ? detectRequiredModules(prompt) : []
  const moduleNote = detectedModules.length > 0
    ? `\n[Loaded specialist modules: ${detectedModules.join(', ')}]`
    : ''

  return `
=================================================================
TURBOBUILDER PRESTIGE KNOWLEDGE BASE${moduleNote}
You generate Roblox assets at PRESTIGE quality — the same standard
as the top 1% of Roblox RP servers. Not copying any specific style,
but matching that LEVEL of detail, scale accuracy, and craftsmanship.
=================================================================

${baseKnowledge}

${scriptingKnowledge}

=================================================================
END OF KNOWLEDGE BASE — Generate at prestige quality.
ALL scripts must be COMPLETE working Luau — no placeholders, no TODOs.
=================================================================
`
}

export function getQualityStandards(systemType: string): string {
  const standards: Record<string, string[]> = {
    builder: [
      'Minimum 60 parts per building',
      'Windows have 5-part frame system',
      'Every room has a light source',
      'Interior fully furnished',
      'Street furniture outside',
      'Correct scale: 1 stud = 28cm',
      'Materials match real surfaces',
      'Neon window parts for night atmosphere',
      'Roof has overhang or parapet',
      'Foundation below ground level',
    ],
    modeling: [
      'Vehicle body uses 15+ parts minimum',
      'Windshields are angled Wedge parts',
      'Wheels have 3-part construction',
      'All ELS lights named correctly',
      'Interior visible through windows',
      'Number plates front and rear',
      'Livery matches real department',
      'ELS script is complete working Luau',
      'Sound IDs included',
    ],
    project: [
      'Minimum 100 parts',
      'Building heights varied',
      '3 depth layers present',
      'Full street furniture per block',
      'Road markings complete',
      'Night atmosphere: glowing windows',
      'Street lights with SpotLight components',
      'At least 1 major landmark',
      'Terrain variation',
      'Themed pack: all items share livery',
    ],
  }
  return (standards[systemType] || []).map(s => `- ${s}`).join('\n')
}

// ── Prompt Interpreter ────────────────────────────────────────────────────
export interface PromptIntent {
  quantity: number
  subject: string
  isCollection: boolean
  modifiers: string[]
  raw: string
}

const COLLECTION_KEYWORDS = [
  'block of','row of','set of','pack of','collection of',
  'group of','street of','bunch of','fleet of','multiple',
  'several','complex','district','estate','development',
]

const NUMBER_WORDS: Record<string, number> = {
  one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  a:1,an:1,single:1,double:2,pair:2,
}

export function interpretPrompt(prompt: string): PromptIntent {
  const lower = prompt.toLowerCase().trim()
  const isCollection = COLLECTION_KEYWORDS.some(kw => lower.includes(kw))

  let quantity = 1
  const digitMatch = lower.match(/\b(\d+)\b/)
  if (digitMatch) {
    quantity = parseInt(digitMatch[1])
  } else {
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      if (lower.includes(` ${word} `) || lower.startsWith(`${word} `)) {
        quantity = num; break
      }
    }
  }

  if (isCollection && quantity === 1) {
    if (lower.includes('block of') || lower.includes('row of')) quantity = 4
    else if (lower.includes('fleet of')) quantity = 3
    else quantity = 3
  }

  const modifierWords = [
    'modern','victorian','derelict','destroyed','abandoned','luxury',
    'uk','british','german','american','australian','french',
    'small','large','tall','short','wide','narrow',
    'urban','rural','coastal','industrial','residential',
    'police','fire','medical','military','government',
    'night','day','winter','summer',
  ]
  const modifiers = modifierWords.filter(m => lower.includes(m))

  return { quantity, subject: prompt, isCollection, modifiers, raw: prompt }
}

export function buildQuantityInstruction(intent: PromptIntent): string {
  if (intent.quantity === 1 && !intent.isCollection) {
    return `
QUANTITY INSTRUCTION — CRITICAL:
Generate EXACTLY ONE ${intent.subject}.
Focus ALL detail on this single asset. Do NOT generate multiples.`
  }
  return `
QUANTITY INSTRUCTION — CRITICAL:
Generate EXACTLY ${intent.quantity} instances of "${intent.subject}".
Each as a separate Model. Arrange in a row with spacing.
Give each slight variations so they don't look copy-pasted.`
}

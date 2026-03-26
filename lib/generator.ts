import { buildRbxmx, type RbxModel } from './rbxmx'
import { getKnowledgeForSystem, getQualityStandards, interpretPrompt, buildQuantityInstruction } from './knowledge/index'
import { filterPrompt } from './prompt-filter'
import { validateRbxmx, watermarkRbxmx } from './output-validator'
import { savePromptHistory } from './prompt-memory'
import { geminiGenerate } from './groq'
import type { StyleType, ScaleType } from './styles'
import { STYLES, SCALES } from './styles'

export interface GenerationOptions {
  style?: StyleType
  scale?: ScaleType
  locationReference?: { address: string; lat: number; lng: number }
  enhancePrompt?: boolean
  variations?: number
}

export interface GenerationResult {
  rbxmx: string
  spec: SpecItem[]
  qualityScore: number
  qualityNotes: string
  quantity: number
  enhancedPrompt?: string
  newScriptsGenerated?: string[]
  validationWarnings?: string[]
}

export interface SpecItem {
  label: string
  category: string
  count: number
}

const SYSTEM_PROMPTS = {
  builder: `You are a prestige-tier Roblox Studio builder. Generate complete building specifications as JSON. Output ONLY valid JSON. No markdown. No explanation.`,
  modeling: `You are a prestige-tier Roblox vehicle builder. Generate complete vehicle specs as JSON. Output ONLY valid JSON. No markdown. No explanation.`,
  project: `You are a prestige-tier Roblox world builder. Generate complete map specifications as JSON. Output ONLY valid JSON. No markdown. No explanation.`,
}

export async function generateAsset(
  prompt: string,
  systemType: 'builder' | 'modeling' | 'project',
  options: GenerationOptions = {},
  userId?: string,
  generationId?: string,
  onProgress?: (msg: string, percent: number) => void
): Promise<GenerationResult> {

  const filter = filterPrompt(prompt)
  if (!filter.allowed) throw new Error(filter.reason)

  onProgress?.('🔍 Preparing generation...', 10)
  const intent = interpretPrompt(prompt)

  const styleInstruction = options.style ? `STYLE: ${options.style}` : ''
  const scaleInstruction = options.scale ? `SCALE: ${options.scale}` : ''
  const extras = [styleInstruction, scaleInstruction].filter(Boolean).join('\n')

  const genPrompt = `${extras ? extras + '\n\n' : ''}REQUEST: "${prompt}"

Generate a detailed Roblox ${systemType} asset. Output ONLY valid JSON:
{
  "models": [{
    "name": "string",
    "parts": [{"name":"string","size":{"x":1,"y":1,"z":1},"position":{"x":0,"y":0,"z":0},"color":"Medium stone grey","material":"brick","anchored":true,"transparency":0,"shape":"Block"}],
    "scripts": [{"name":"string","type":"Script","source":"-- complete Luau code here"}],
    "children": []
  }],
  "spec": [{"label":"string","category":"structure","count":1}]
}`

  onProgress?.('⚡ Generating at prestige quality...', 40)
  const genText = await geminiGenerate(SYSTEM_PROMPTS[systemType], genPrompt, 6000)

  let genData: { models: RbxModel[]; spec: SpecItem[] }
  try {
    genData = JSON.parse(genText.replace(/```json|```/g, '').trim())
  } catch {
    throw new Error('Failed to parse generation response')
  }

  onProgress?.('📦 Compiling & validating .rbxmx...', 90)
  let rbxmx = buildRbxmx(genData.models)
  const validation = validateRbxmx(rbxmx)
  if (validation.fixed) rbxmx = validation.fixed
  if (userId && generationId) rbxmx = watermarkRbxmx(rbxmx, generationId, userId)

  if (userId) {
    await savePromptHistory(userId, {
      prompt,
      system_type: systemType,
      quality_score: 85,
      style: options.style,
      scale: options.scale,
    }).catch(() => {})
  }

  onProgress?.('✅ Complete!', 100)

  return {
    rbxmx,
    spec: genData.spec || [],
    qualityScore: 85,
    qualityNotes: 'Generated successfully.',
    quantity: intent.quantity,
    validationWarnings: [...validation.warnings, ...validation.tosIssues],
  }
}

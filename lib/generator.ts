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
  builder: `You are a prestige-tier Roblox Studio builder with 10 years of experience.
Generate complete production-quality building specifications as JSON.
Quality: top 1% of Roblox RP servers. Detailed, accurate, immersive.
Output ONLY valid JSON. No markdown. No explanation.`,
  modeling: `You are a prestige-tier Roblox vehicle builder and scripter with 10 years of experience.
Generate complete production-quality vehicle specs as JSON.
Output ONLY valid JSON. No markdown. No explanation.`,
  project: `You are a prestige-tier Roblox world builder with 10 years of experience.
Generate complete production-quality map and pack specifications as JSON.
Output ONLY valid JSON. No markdown. No explanation.`,
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
  const knowledgeBase = getKnowledgeForSystem(systemType, prompt)
  const qualityStandards = getQualityStandards(systemType)

  const styleInstruction = options.style
    ? `STYLE: "${STYLES[options.style].label}" — ${STYLES[options.style].description}. Materials: ${STYLES[options.style].materials}. Colors: ${STYLES[options.style].colors}.` : ''
  const scaleInstruction = options.scale
    ? `SCALE: "${SCALES[options.scale].label}" (${SCALES[options.scale].multiplier}x multiplier).` : ''
  const extras = [styleInstruction, scaleInstruction].filter(Boolean).join('\n')

  const genPrompt = `
${knowledgeBase}

${buildQuantityInstruction(intent)}
${extras}

REQUEST: "${prompt}"
SYSTEM: ${systemType}

QUALITY STANDARDS:
${qualityStandards}

Output JSON:
{
  "models": [{
    "name": "string",
    "parts": [{"name":"descriptive","size":{"x":0,"y":0,"z":0},"position":{"x":0,"y":0,"z":0},"color":"BrickColor","material":"brick|metal|wood|glass|plastic|concrete|fabric|neon","anchored":true,"transparency":0,"shape":"Block|Sphere|Cylinder|Wedge"}],
    "scripts": [{"name":"string","type":"Script|LocalScript|ModuleScript","source":"COMPLETE Luau — zero placeholders"}],
    "children": []
  }],
  "spec": [{"label":"string","category":"structure|script|vehicle|terrain|furniture","count":0}]
}`

  onProgress?.('⚡ Generating at prestige quality...', 40)
  const genText = await geminiGenerate(SYSTEM_PROMPTS[systemType], genPrompt, 8000)

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

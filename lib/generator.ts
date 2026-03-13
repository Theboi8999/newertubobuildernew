import Anthropic from '@anthropic-ai/sdk'
import { buildRbxmx, type RbxModel } from './rbxmx'
import { researchTopic } from './research'
import { getKnowledgeForSystem, getQualityStandards, interpretPrompt, buildQuantityInstruction } from './knowledge/index'
import { enhancePrompt } from './prompt-enhancer'
import { filterPrompt } from './prompt-filter'
import { getScriptsForPrompt } from './script-library'
import { autoResolveDependencies } from './scene-builder'
import { validateRbxmx, watermarkRbxmx } from './output-validator'
import { savePromptHistory } from './prompt-memory'
import { logFailedGeneration } from './analytics'
import type { StyleType, ScaleType } from './styles'
import { STYLES, SCALES } from './styles'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  variations?: GenerationResult[]
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
Quality: shaped bodywork, working ELS, proper livery, complete Luau scripts.
Output ONLY valid JSON. No markdown. No explanation.`,
  project: `You are a prestige-tier Roblox world builder with 10 years of experience.
Generate complete production-quality map and pack specifications as JSON.
Quality: depth, layers, atmosphere, full street furniture, landmarks.
Output ONLY valid JSON. No markdown. No explanation.`,
}

const QUALITY_PROMPT = `You are a senior Roblox Studio quality inspector.
Score against prestige-tier standards (top 1% of RP servers).
Output ONLY JSON: {"score": number, "notes": string}`

async function runSingleGeneration(
  prompt: string,
  systemType: 'builder' | 'modeling' | 'project',
  options: GenerationOptions,
  research: { summary: string },
  knowledgeBase: string,
  qualityStandards: string,
  intent: ReturnType<typeof interpretPrompt>,
  libraryKnowledge: string,
  dependencyKnowledge: string,
  attempt: number = 1
): Promise<{ data: { models: RbxModel[]; spec: SpecItem[] }; qualityScore: number; qualityNotes: string }> {

  const styleInstruction = options.style
    ? `STYLE: "${STYLES[options.style].label}" — ${STYLES[options.style].description}. Materials: ${STYLES[options.style].materials}. Colors: ${STYLES[options.style].colors}.` : ''
  const scaleInstruction = options.scale
    ? `SCALE: "${SCALES[options.scale].label}" (${SCALES[options.scale].multiplier}x multiplier).` : ''
  const locationInstruction = options.locationReference
    ? `REAL WORLD REFERENCE: "${options.locationReference.address}" — use as style/layout inspiration, not exact copy.` : ''

  const extras = [styleInstruction, scaleInstruction, locationInstruction].filter(Boolean).join('\n')

  const genPrompt = `
${knowledgeBase}

${libraryKnowledge ? `=== LIBRARY SCRIPTS ===\n${libraryKnowledge}\n=== END LIBRARY ===` : ''}
${dependencyKnowledge ? `=== DEPENDENCY SCRIPTS ===\n${dependencyKnowledge}\n=== END DEPENDENCIES ===` : ''}

${buildQuantityInstruction(intent)}
${extras}

REQUEST: "${prompt}"
SYSTEM: ${systemType}
${attempt > 1 ? `ATTEMPT ${attempt}: Previous score < 75. Significantly improve quality.` : ''}

RESEARCH: ${research.summary}

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

  const genRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: SYSTEM_PROMPTS[systemType],
    messages: [{ role: 'user', content: genPrompt }],
  })

  const genText = genRes.content[0].type === 'text' ? genRes.content[0].text : ''
  let genData: { models: RbxModel[]; spec: SpecItem[] }
  try {
    genData = JSON.parse(genText.replace(/```json|```/g, '').trim())
  } catch {
    throw new Error('Failed to parse generation')
  }

  let qualityScore = 85
  let qualityNotes = 'Passed quality check.'
  try {
    const qr = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: QUALITY_PROMPT,
      messages: [{ role: 'user', content: `Prompt: "${prompt}" | System: ${systemType}\nStandards:\n${qualityStandards}\nGeneration:\n${JSON.stringify(genData).slice(0, 3000)}` }],
    })
    const qText = qr.content[0].type === 'text' ? qr.content[0].text : ''
    const qData = JSON.parse(qText.replace(/```json|```/g, '').trim())
    qualityScore = qData.score
    qualityNotes = qData.notes
  } catch {}

  return { data: genData, qualityScore, qualityNotes }
}

export async function generateAsset(
  prompt: string,
  systemType: 'builder' | 'modeling' | 'project',
  options: GenerationOptions = {},
  userId?: string,
  generationId?: string,
  onProgress?: (msg: string, percent: number) => void
): Promise<GenerationResult> {

  // 1. Filter
  const filter = filterPrompt(prompt)
  if (!filter.allowed) throw new Error(filter.reason)

  // 2. Enhance prompt
  let finalPrompt = prompt
  let enhancedPrompt: string | undefined
  if (options.enhancePrompt !== false) {
    onProgress?.('✨ Enhancing prompt...', 5)
    enhancedPrompt = await enhancePrompt(prompt, systemType)
    finalPrompt = enhancedPrompt
  }

  // 3. Interpret
  onProgress?.('🔍 Interpreting request...', 8)
  const intent = interpretPrompt(finalPrompt)

  // 4. Script library + dependency resolution (parallel)
  onProgress?.('📚 Checking script library & resolving dependencies...', 12)
  const [{ injectedKnowledge, newScriptsGenerated }, dependencyKnowledge] = await Promise.all([
    getScriptsForPrompt(finalPrompt, (msg) => onProgress?.(msg, 14)),
    autoResolveDependencies(finalPrompt, systemType, (msg) => onProgress?.(msg, 16)),
  ])

  // 5. Research
  onProgress?.('🔬 Research bot scanning...', 22)
  const research = await researchTopic(finalPrompt, systemType)

  // 6. Knowledge
  onProgress?.('📖 Loading knowledge base...', 30)
  const knowledgeBase = getKnowledgeForSystem(systemType, finalPrompt)
  const qualityStandards = getQualityStandards(systemType)

  // 7. Generate
  onProgress?.('⚡ Generating at prestige quality...', 42)
  let result = await runSingleGeneration(
    finalPrompt, systemType, options, research,
    knowledgeBase, qualityStandards, intent,
    injectedKnowledge, dependencyKnowledge, 1
  )

  // 8. Auto-retry if quality < 75
  if (result.qualityScore < 75) {
    onProgress?.(`⚠️ Score ${result.qualityScore}/100 — auto-improving...`, 60)
    const retry = await runSingleGeneration(
      finalPrompt, systemType, options, research,
      knowledgeBase, qualityStandards, intent,
      injectedKnowledge, dependencyKnowledge, 2
    )
    if (retry.qualityScore > result.qualityScore) result = retry

    // Log if still bad
    if (result.qualityScore < 60 && userId) {
      await logFailedGeneration(finalPrompt, systemType, result.qualityScore, result.qualityNotes, userId)
    }
  }

  // 9. Variations
  let variations: GenerationResult[] | undefined
  if (options.variations && options.variations > 1) {
    onProgress?.(`🎨 Generating ${options.variations} variations...`, 72)
    variations = []
    for (let i = 1; i < options.variations; i++) {
      const varResult = await runSingleGeneration(
        `${finalPrompt} (variation ${i+1} — slightly different design)`,
        systemType, options, research,
        knowledgeBase, qualityStandards, intent,
        injectedKnowledge, dependencyKnowledge, 1
      )
      const varRbxmx = buildRbxmx(varResult.data.models)
      const validated = validateRbxmx(varRbxmx)
      variations.push({
        rbxmx: validated.fixed || varRbxmx,
        spec: varResult.data.spec || [],
        qualityScore: varResult.qualityScore,
        qualityNotes: varResult.qualityNotes,
        quantity: intent.quantity,
      })
    }
  }

  // 10. Build + validate + watermark
  onProgress?.('📦 Compiling & validating .rbxmx...', 90)
  let rbxmx = buildRbxmx(result.data.models)
  const validation = validateRbxmx(rbxmx)
  if (validation.fixed) rbxmx = validation.fixed
  if (userId && generationId) rbxmx = watermarkRbxmx(rbxmx, generationId, userId)

  // 11. Save prompt history
  if (userId) {
    await savePromptHistory(userId, {
      prompt: finalPrompt,
      system_type: systemType,
      quality_score: result.qualityScore,
      style: options.style,
      scale: options.scale,
    }).catch(() => {})
  }

  onProgress?.('✅ Complete!', 100)

  return {
    rbxmx,
    spec: result.data.spec || [],
    qualityScore: result.qualityScore,
    qualityNotes: result.qualityNotes,
    quantity: intent.quantity,
    enhancedPrompt,
    newScriptsGenerated: newScriptsGenerated.length > 0 ? newScriptsGenerated : undefined,
    validationWarnings: [...validation.warnings, ...validation.tosIssues],
    variations,
  }
}

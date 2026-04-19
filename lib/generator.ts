// lib/generator.ts
import { groqGenerate } from './groq'
import { createAdminClient } from './supabase'
import { getKnowledgeForSystem, getQualityStandards, interpretPrompt, buildQuantityInstruction, SystemType } from './knowledge/index'
import { getKnowledgeForPrompt } from './knowledge-store'
import { getScriptsForPrompt } from './script-library'
import { validateRbxmx, watermarkRbxmx } from './output-validator'
import { savePromptHistory, getUserPreferences } from './prompt-memory'
import { researchTopic } from './research'
import { buildRbxmx, RbxModel, RbxPart } from './rbxmx'
import { researchBuildingType, ResearchResult } from './research-agent'
import { compileBlueprint } from './blueprint-compiler'
import { applyStyleDefaults, matchStyleLibrary } from './style-library'
import { analysePrompt } from './prompt-intelligence'
import { preGate, postGate } from './quality-gate'
import type { QualityTarget } from './vision-analyzer'

export interface GenerateOptions {
  style?: string
  scale?: string
  locationReference?: string
  variations?: number
  referenceImages?: Array<{ base64: string; mimeType: string }>
  exteriorOnly?: boolean
  floorCountOverride?: number
  buildingStyle?: string
}

export interface GenerateResult {
  rbxmx: string
  spec: string[]
  qualityScore: number
  qualityNotes: string
  newScriptsGenerated: string[]
  validationWarnings: string[]
  partCount: number
  roomLayout?: import('./blueprint-compiler').RoomLayoutItem[]
  irlImageUrls?: string[]
}

export async function generateAsset(
  prompt: string,
  systemType: string,
  options: GenerateOptions,
  userId: string,
  generationId: string,
  onProgress?: (msg: string, percent: number) => Promise<void>
): Promise<GenerateResult> {
  console.log('[generateAsset] systemType:', systemType, 'prompt:', prompt.substring(0, 50))
  await onProgress?.('🔍 Analysing prompt...', 15)

  // ── Builder branch: runs FIRST — no Groq/knowledge calls before this ──────
  if (systemType === 'builder') {
    console.log('[generateAsset] ═══ BUILDER BRANCH START')
    console.log('[generator] BUILDER START')

    let allParts: RbxPart[] = []
    let specItems: string[] = []
    let usedFallback = false
    let researchResult: ResearchResult | null = null
    let compiled: ReturnType<typeof compileBlueprint> | null = null
    let qualityTarget: QualityTarget | undefined
    let irlImageUrls: string[] = []

    const intent = analysePrompt(prompt)
    const buildingType = intent.buildingType
    console.log('[generateAsset] analysePrompt result:', JSON.stringify(intent))

    if (options.referenceImages && options.referenceImages.length > 0) {
      try {
        const { analyzeRobloxReference, findIRLReferences } = await import('./vision-analyzer')
        await onProgress?.('🎨 Analysing reference images...', 30)
        const targets = await Promise.all(
          options.referenceImages.map(img => analyzeRobloxReference(img.base64, img.mimeType))
        )
        qualityTarget = targets.reduce((a, b) => a.detailLevel > b.detailLevel ? a : b)
        console.log('[generator] qualityTarget from reference:', JSON.stringify(qualityTarget))
        if (buildingType) {
          irlImageUrls = await findIRLReferences(buildingType)
          console.log('[generator] found', irlImageUrls.length, 'IRL reference URLs')
        }
      } catch (e) {
        console.error('[generator] vision analysis error:', e)
      }
    }

    if (buildingType) {
      try {
        await onProgress?.('🔬 Researching building type...', 50)
        let teachingContext = ''
        try {
          const { getTeachingContext } = await import('./self-teaching-agent')
          teachingContext = await getTeachingContext(buildingType)
        } catch (e) {
          console.error('[generateAsset] teaching context error:', e)
        }

        researchResult = await researchBuildingType(buildingType, { forceRefresh: false, teachingContext })
        researchResult = applyStyleDefaults(researchResult)

        if (intent.floorCountHint && intent.floorCountHint > 1) {
          researchResult = { ...researchResult, floorCount: intent.floorCountHint }
          console.log('[generator] floor hint applied:', intent.floorCountHint)
        }
        if (options.floorCountOverride && options.floorCountOverride > 0) {
          researchResult = { ...researchResult, floorCount: options.floorCountOverride }
        }
        if (options.buildingStyle) {
          const sm = matchStyleLibrary('', options.buildingStyle)
          if (sm) researchResult = { ...researchResult, ...sm }
        }

        const gate = preGate(researchResult)
        if (!gate.passed) {
          console.log('[generator] pre-gate failed, retrying research')
          researchResult = await researchBuildingType(buildingType, { forceRefresh: true })
          researchResult = applyStyleDefaults(researchResult)
        }

        console.log('[generateAsset] research confidence:', researchResult.confidence)
        compiled = compileBlueprint(researchResult)
        allParts = options.exteriorOnly
          ? [...compiled.exterior]
          : [...compiled.rooms.flat(), ...compiled.exterior]
        console.log('[generator] compiled parts count:', allParts.length)
        specItems = researchResult.rooms.map(r => r.name)

        try {
          const supabaseAdmin = createAdminClient()
          await supabaseAdmin.from('research_cache').update({ blueprint: compiled }).eq('building_type', buildingType)
        } catch (e) {
          console.error('[generateAsset] blueprint cache save error:', e)
        }
      } catch (e) {
        console.error('[generateAsset] research/compile error:', e)
      }
    }

    if (allParts.length === 0) {
      allParts = buildGenericBuilding(['Reception', 'Main Office', 'Holding Cell', 'Break Room', 'Briefing Room', 'Locker Room'])
      specItems = ['Reception', 'Main Office', 'Holding Cell', 'Break Room', 'Briefing Room', 'Locker Room']
      usedFallback = true
    }

    const modelName = buildingType
      ? buildingType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Building'

    const model: RbxModel = { name: modelName, parts: allParts, scripts: [] }
    const rbxmxBuilt = buildRbxmx([model])
    const rbxmxFinal = watermarkRbxmx(rbxmxBuilt, generationId, userId)

    let qualityScore = usedFallback ? 75 : 85
    let qualityNotes = usedFallback ? 'Fallback generic building' : options.exteriorOnly ? 'Exterior only build' : 'Blueprint build'

    if (researchResult && buildingType) {
      try {
        const { evaluateGeneration } = await import('./auto-evaluator')
        const evalResult = await evaluateGeneration({ rbxmx: rbxmxFinal, buildingType, researchResult, generationId })
        qualityScore = evalResult.score
        qualityNotes = evalResult.notes
      } catch (e) {
        console.error('[generateAsset] auto-evaluator error:', e)
      }
      try {
        const { teachFromGeneration } = await import('./self-teaching-agent')
        const roomNames = researchResult.rooms.map(r => r.name)
        await teachFromGeneration({ buildingType, qualityScore, partCount: allParts.length, roomNames, generationId })
      } catch (e) {
        console.error('[generateAsset] teach from generation error:', e)
      }
    }

    savePromptHistory(userId, {
      prompt,
      system_type: systemType,
      quality_score: qualityScore,
      style: options.style,
      scale: options.scale,
    }).catch(() => {})

    return {
      rbxmx: rbxmxFinal,
      spec: specItems,
      qualityScore,
      qualityNotes,
      newScriptsGenerated: [],
      validationWarnings: [],
      partCount: allParts.length,
      roomLayout: compiled?.roomLayout,
      irlImageUrls,
    }
  }

  // ── All other system types: knowledge + Groq generation ─────────────────
  const staticKnowledge = getKnowledgeForSystem(systemType as SystemType, prompt)
  const qualityStandards = getQualityStandards(systemType)
  const promptIntent = interpretPrompt(prompt)
  const quantityInstruction = buildQuantityInstruction(promptIntent)

  const dbKnowledge = await getKnowledgeForPrompt(prompt)
  const userPrefs = await getUserPreferences(userId).catch(() => null)
  const research = await researchTopic(prompt, systemType)

  await onProgress?.('📚 Loading specialist scripts...', 25)

  const { injectedKnowledge: scriptKnowledge, newScriptsGenerated } = await getScriptsForPrompt(
    prompt,
    (msg: string) => { onProgress?.(msg, 30) }
  )

  await onProgress?.('⚡ Generating your asset...', 45)

  const systemPrompt = buildSystemPrompt(
    staticKnowledge,
    dbKnowledge,
    scriptKnowledge,
    qualityStandards,
    research.summary,
    userPrefs,
    options
  )

  const userPrompt = buildUserPrompt(prompt, quantityInstruction, options)

  const trimmedKnowledge = systemPrompt.slice(0, 4000)
  const rawOutput = await groqGenerate(trimmedKnowledge, userPrompt, 8000)

  await onProgress?.('🔧 Validating output...', 85)

  const rbxmxRaw = extractRbxmx(rawOutput)
  const spec = extractSpec(rawOutput)
  const validation = validateRbxmx(rbxmxRaw)
  const rbxmxFixed = validation.fixed || rbxmxRaw
  const rbxmxFinal = watermarkRbxmx(rbxmxFixed, generationId, userId)

  const { score, notes } = scoreQuality(rbxmxFinal, spec, systemType)

  savePromptHistory(userId, {
    prompt,
    system_type: systemType,
    quality_score: score,
    style: options.style,
    scale: options.scale,
  }).catch(() => {})

  const xmlPartCount = (rbxmxFinal.match(/<Item class="Part"/g) || []).length

  return {
    rbxmx: rbxmxFinal,
    spec,
    qualityScore: score,
    qualityNotes: notes,
    newScriptsGenerated,
    validationWarnings: [...validation.warnings, ...validation.tosIssues],
    partCount: xmlPartCount,
  }
}


function buildGenericBuilding(rooms: string[]): RbxPart[] {
  return rooms.flatMap((room, i): RbxPart[] => {
    const x = (i % 3) * 22
    const z = Math.floor(i / 3) * 22
    return [
      { name: `${room}_Floor`, size: { x: 20, y: 1, z: 20 }, position: { x, y: 0.5, z }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0 },
      { name: `${room}_WallFront`, size: { x: 20, y: 8, z: 0.5 }, position: { x, y: 4.5, z: z - 10 }, color: 'Light grey', material: 'smoothplastic', anchored: true, transparency: 0 },
      { name: `${room}_WallBack`, size: { x: 20, y: 8, z: 0.5 }, position: { x, y: 4.5, z: z + 10 }, color: 'Light grey', material: 'smoothplastic', anchored: true, transparency: 0 },
      { name: `${room}_WallLeft`, size: { x: 0.5, y: 8, z: 20 }, position: { x: x - 10, y: 4.5, z }, color: 'Light grey', material: 'smoothplastic', anchored: true, transparency: 0 },
      { name: `${room}_WallRight`, size: { x: 0.5, y: 8, z: 20 }, position: { x: x + 10, y: 4.5, z }, color: 'Light grey', material: 'smoothplastic', anchored: true, transparency: 0 },
    ]
  })
}

function buildSystemPrompt(
  staticKnowledge: string,
  dbKnowledge: string,
  scriptKnowledge: string,
  qualityStandards: string,
  researchSummary: string,
  userPrefs: any,
  options: GenerateOptions
): string {
  const dbSection = dbKnowledge
    ? `\n\n=== RESEARCHER DATABASE KNOWLEDGE ===\n${dbKnowledge}\n=== END DATABASE KNOWLEDGE ===`
    : ''
  const scriptSection = scriptKnowledge
    ? `\n\n=== SPECIALIST SCRIPT LIBRARY ===\n${scriptKnowledge}\n=== END SCRIPT LIBRARY ===`
    : ''
  const researchSection = researchSummary
    ? `\n\n=== REFERENCE RESEARCH ===\n${researchSummary}\n=== END RESEARCH ===`
    : ''
  const prefNote = userPrefs?.preferred_style
    ? `\nUser prefers: ${userPrefs.preferred_style} style, ${userPrefs.preferred_scale || 'medium'} scale.`
    : ''
  const optNote = [
    options.style && `Style: ${options.style}`,
    options.scale && `Scale: ${options.scale}`,
    options.locationReference && `Location reference: ${options.locationReference}`,
  ].filter(Boolean).join(' | ')

  return `${staticKnowledge}${dbSection}${scriptSection}${researchSection}

QUALITY STANDARDS (must meet ALL of these):
${qualityStandards}
${prefNote}
${optNote ? `Generation options: ${optNote}` : ''}

OUTPUT FORMAT — CRITICAL:
1. Output the complete .rbxmx XML inside a code block: \`\`\`xml ... \`\`\`
2. After the XML block, add a spec section:
===SPEC===
- [component]: [description]
===ENDSPEC===

ABSOLUTE RULES:
- Output ONLY valid Roblox .rbxmx XML — no partial files, no TODOs
- ALL Luau scripts must be COMPLETE and WORKING — zero placeholders
- Use task.wait() not wait(). Use task.spawn() not spawn().
- Important logic (damage, money, data) MUST run on the Server
- Match PRESTIGE quality — the top 1% of Roblox RP servers`
}

function buildUserPrompt(
  prompt: string,
  quantityInstruction: string,
  options: GenerateOptions
): string {
  const variationsNote = options.variations && options.variations > 1
    ? `\nGenerate ${options.variations} variations with subtle differences.`
    : ''
  return `Generate a Roblox asset for: "${prompt}"

${quantityInstruction}${variationsNote}

Output the complete .rbxmx file now.`
}

function extractRbxmx(output: string): string {
  const xmlMatch = output.match(/```xml\s*([\s\S]*?)```/)
  if (xmlMatch) return xmlMatch[1].trim()

  const robloxMatch = output.match(/<roblox[\s\S]*?<\/roblox>/)
  if (robloxMatch) return robloxMatch[0]

  return `<?xml version="1.0" encoding="utf-8"?>\n<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n${output}\n</roblox>`
}

function extractSpec(output: string): string[] {
  const match = output.match(/===SPEC===([\s\S]*?)===ENDSPEC===/)
  if (!match) return []
  return match[1]
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('-'))
    .map(l => l.replace(/^-\s*/, ''))
}

function scoreQuality(
  rbxmx: string,
  spec: string[],
  systemType: string
): { score: number; notes: string } {
  let score = 45
  const notes: string[] = []

  const partCount = (rbxmx.match(/class="Part"/g) || []).length
  if (partCount >= 100) { score += 25; notes.push(`${partCount} parts`) }
  else if (partCount >= 60) { score += 18; notes.push(`${partCount} parts`) }
  else if (partCount >= 30) { score += 10; notes.push(`${partCount} parts`) }
  else if (partCount > 0) { score += 5; notes.push(`${partCount} parts (sparse)`) }
  else { notes.push('No parts found') }

  const scriptCount = (rbxmx.match(/class="Script"|class="LocalScript"|class="ModuleScript"/g) || []).length
  if (scriptCount >= 3) { score += 15; notes.push(`${scriptCount} scripts`) }
  else if (scriptCount > 0) { score += 8; notes.push(`${scriptCount} script(s)`) }

  if (spec.length >= 10) score += 10
  else if (spec.length >= 5) score += 5

  if (systemType === 'modeling') {
    if (rbxmx.toLowerCase().includes('els') || rbxmx.includes('Siren')) { score += 5; notes.push('ELS') }
  }

  score = Math.min(100, Math.max(0, score))
  return { score, notes: notes.join(', ') || 'Generated' }
}

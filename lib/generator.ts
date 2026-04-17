// lib/generator.ts
import { geminiGenerate } from './groq'
import { getKnowledgeForSystem, getQualityStandards, interpretPrompt, buildQuantityInstruction, SystemType } from './knowledge/index'
import { getKnowledgeForPrompt } from './knowledge-store'
import { getScriptsForPrompt } from './script-library'
import { validateRbxmx, watermarkRbxmx } from './output-validator'
import { savePromptHistory, getUserPreferences } from './prompt-memory'
import { researchTopic } from './research'

export interface GenerateOptions {
  style?: string
  scale?: string
  locationReference?: string
  variations?: number
}

export interface GenerateResult {
  rbxmx: string
  spec: string[]
  qualityScore: number
  qualityNotes: string
  newScriptsGenerated: string[]
  validationWarnings: string[]
}

export async function generateAsset(
  prompt: string,
  systemType: string,
  options: GenerateOptions,
  userId: string,
  generationId: string,
  onProgress?: (msg: string, percent: number) => Promise<void>
): Promise<GenerateResult> {
  await onProgress?.('🔍 Analysing prompt...', 15)

  // Static knowledge base
  const staticKnowledge = getKnowledgeForSystem(systemType as SystemType, prompt)
  const qualityStandards = getQualityStandards(systemType)
  const promptIntent = interpretPrompt(prompt)
  const quantityInstruction = buildQuantityInstruction(promptIntent)

  // Dynamic DB knowledge injected from admin research panel
  const dbKnowledge = await getKnowledgeForPrompt(prompt)

  // User preferences (non-fatal)
  const userPrefs = await getUserPreferences(userId).catch(() => null)

  // Hardcoded research fallback
  const research = await researchTopic(prompt, systemType)

  await onProgress?.('📚 Loading specialist scripts...', 25)

  // Script library injection
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

  const rawOutput = await geminiGenerate(systemPrompt, userPrompt, 8000)

  await onProgress?.('🔧 Validating output...', 85)

  const rbxmxRaw = extractRbxmx(rawOutput)
  const spec = extractSpec(rawOutput)
  const validation = validateRbxmx(rbxmxRaw)
  const rbxmxFixed = validation.fixed || rbxmxRaw
  const rbxmxFinal = watermarkRbxmx(rbxmxFixed, generationId, userId)

  const { score, notes } = scoreQuality(rbxmxFinal, spec, systemType)

  // Save history non-fatally
  savePromptHistory(userId, {
    prompt,
    system_type: systemType,
    quality_score: score,
    style: options.style,
    scale: options.scale,
  }).catch(() => {})

  return {
    rbxmx: rbxmxFinal,
    spec,
    qualityScore: score,
    qualityNotes: notes,
    newScriptsGenerated,
    validationWarnings: [...validation.warnings, ...validation.tosIssues],
  }
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
  if (systemType === 'builder') {
    if ((rbxmx.match(/class="PointLight"|class="SpotLight"|class="SurfaceLight"/g) || []).length > 0) {
      score += 5; notes.push('Lighting')
    }
  }

  score = Math.min(100, Math.max(0, score))
  return { score, notes: notes.join(', ') || 'Generated' }
}

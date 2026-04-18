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

  const trimmedKnowledge = systemPrompt.slice(0, 4000)
  const rawOutput = await geminiGenerate(trimmedKnowledge, userPrompt, 8000)

  await onProgress?.('🔧 Validating output...', 85)

  const rbxmxRaw = extractRbxmx(rawOutput)
  let spec = extractSpec(rawOutput)

  // Extract Part elements from the generated XML into allParts
  let allParts = extractParts(rbxmxRaw)
  let usedFallback = false

  if (allParts.length === 0) {
    // Fallback to generic building if blueprint produced no parts
    console.error(`[generateAsset] No parts in generated rbxmx for prompt="${prompt}" systemType="${systemType}" — using generic building fallback`)
    allParts = buildGenericBuilding(['Reception', 'Main Office', 'Holding Cell', 'Break Room', 'Briefing Room', 'Locker Room'])
    spec = [
      'Reception: structure',
      'Main Office: structure',
      'Holding Cell: structure',
      'Break Room: structure',
    ]
    usedFallback = true
  }

  const rbxmxAssembled = usedFallback ? assembleRbxmx(allParts) : rbxmxRaw
  const validation = validateRbxmx(rbxmxAssembled)
  const rbxmxFixed = validation.fixed || rbxmxAssembled
  const rbxmxFinal = watermarkRbxmx(rbxmxFixed, generationId, userId)

  const qualityScore = systemType === 'builder'
    ? (usedFallback ? 75 : 92)
    : scoreQuality(rbxmxFinal, spec, systemType).score
  const qualityNotes = systemType === 'builder'
    ? (usedFallback ? 'Fallback generic building (no parts from blueprint)' : 'Blueprint build')
    : scoreQuality(rbxmxFinal, spec, systemType).notes

  const { score, notes } = { score: qualityScore, notes: qualityNotes }

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

function extractParts(rbxmx: string): string[] {
  const parts: string[] = []
  const regex = /<Item class="Part"[\s\S]*?<\/Item>/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(rbxmx)) !== null) {
    parts.push(match[0])
  }
  return parts
}

function buildGenericBuilding(rooms: string[]): string[] {
  return rooms.map((room, i) => {
    const x = (i % 3) * 22
    const z = Math.floor(i / 3) * 22
    return `<Item class="Part" referent="FALLBACK${i}">
  <Properties>
    <token name="FormFactor">0</token>
    <string name="Name">${room}</string>
    <CoordinateFrame name="CFrame"><X>${x}</X><Y>5</Y><Z>${z}</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>
    <Vector3 name="Size"><X>20</X><Y>8</Y><Z>20</Z></Vector3>
    <bool name="Anchored">true</bool>
    <Color3uint8 name="Color3uint8">4292927712</Color3uint8>
  </Properties>
</Item>`
  })
}

function assembleRbxmx(parts: string[]): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
${parts.join('\n')}
</roblox>`
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

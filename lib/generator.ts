import { groqChat } from './groq'
import { researchPrompt } from './research'
import { generateRbxmx } from './rbxmx'
import { getKnowledge } from './knowledge/index'

export interface SpecItem { label: string; count: number; category: string; added_at: string }
export interface GenerationResult { rbxmx: string; spec: SpecItem[]; qualityScore: number; qualityNotes: string }

const JSON_SYSTEM = `You are a Roblox asset generator. Output ONLY valid JSON, no markdown, no backticks, no explanation.`

function parseJson(raw: string): any {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return null
}

// Step 1: Enhance the prompt
async function enhance(prompt: string, systemType: string, style?: string, size?: string): Promise<string> {
  try {
    return (await groqChat(
      'You are a Roblox asset prompt engineer. Expand the prompt into a detailed brief (max 150 words). Be specific about rooms, features, scripts, materials. Return ONLY the enhanced prompt.',
      `System: ${systemType}. Style: ${style || 'none'}. Size: ${size || 'medium'}. Prompt: ${prompt}`,
      400
    )).trim() || prompt
  } catch { return prompt }
}

// Step 2: Specialist sub-agents — each focuses on one area
async function structureAgent(prompt: string, knowledge: string, size: string): Promise<any[]> {
  const raw = await groqChat(JSON_SYSTEM,
    `${knowledge}\n\nGenerate ONLY the structural parts (walls, floors, roof, exterior) for: "${prompt}"\nSize: ${size}\nReturn JSON array of parts:\n[{"name":"...","size":[x,y,z],"position":[x,y,z],"color":[r,g,b],"material":"SmoothPlastic","anchored":true,"transparency":0}]`,
    3000)
  const match = raw.match(/\[[\s\S]*\]/)
  try { return match ? JSON.parse(match[0]) : [] } catch { return [] }
}

async function interiorAgent(prompt: string, knowledge: string): Promise<any[]> {
  const raw = await groqChat(JSON_SYSTEM,
    `${knowledge}\n\nGenerate ONLY interior parts (furniture, fixtures, fittings, equipment) for: "${prompt}"\nReturn JSON array of parts:\n[{"name":"...","size":[x,y,z],"position":[x,y,z],"color":[r,g,b],"material":"SmoothPlastic","anchored":true,"transparency":0}]`,
    3000)
  const match = raw.match(/\[[\s\S]*\]/)
  try { return match ? JSON.parse(match[0]) : [] } catch { return [] }
}

async function scriptAgent(prompt: string, knowledge: string, systemType: string): Promise<any[]> {
  const raw = await groqChat(JSON_SYSTEM,
    `${knowledge}\n\nGenerate working Luau scripts for: "${prompt}" (system: ${systemType})\nReturn JSON array:\n[{"name":"ScriptName","type":"Script","source":"-- lua code here"}]\nWrite complete, working scripts. Use task.wait() not wait().`,
    3000)
  const match = raw.match(/\[[\s\S]*\]/)
  try { return match ? JSON.parse(match[0]) : [] } catch { return [] }
}

async function materialAgent(prompt: string, parts: any[]): Promise<any[]> {
  if (!parts.length) return parts
  const partNames = parts.slice(0, 20).map(p => p.name).join(', ')
  const raw = await groqChat(JSON_SYSTEM,
    `For a Roblox build: "${prompt}", review these parts and suggest improved materials and colors.\nParts: ${partNames}\nValid materials: SmoothPlastic, Brick, Concrete, Metal, Wood, Neon, Glass, Fabric, DiamondPlate, Granite, Marble, WoodPlanks, CorrodedMetal\nReturn JSON array of updates: [{"name":"PartName","material":"NewMaterial","color":[r,g,b]}]`,
    1500)
  const match = raw.match(/\[[\s\S]*\]/)
  try {
    const updates: any[] = match ? JSON.parse(match[0]) : []
    const updateMap = new Map(updates.map(u => [u.name, u]))
    return parts.map(p => {
      const update = updateMap.get(p.name)
      if (update) return { ...p, material: update.material || p.material, color: update.color || p.color }
      return p
    })
  } catch { return parts }
}

// Step 3: Quality check
async function qualityCheck(prompt: string, partCount: number, scriptCount: number): Promise<{ score: number; notes: string }> {
  try {
    const raw = await groqChat(JSON_SYSTEM,
      `Rate this Roblox asset generation:\nPrompt: "${prompt}"\nParts generated: ${partCount}\nScripts generated: ${scriptCount}\nScore 0-100 based on: complexity (parts>20=good), scripts present, likely matches prompt.\nReturn: {"score":85,"notes":"Brief feedback"}`,
      200)
    const parsed = parseJson(raw)
    if (parsed) return { score: parsed.score ?? 75, notes: parsed.notes ?? '' }
  } catch {}
  return { score: partCount > 20 ? 78 : partCount > 10 ? 65 : 50, notes: '' }
}

export async function generateAsset(
  prompt: string,
  systemType: string,
  options: { style?: string; size?: string; variation?: number } = {},
  userId?: string,
  supabase?: any
): Promise<GenerationResult> {
  const size = options.size || 'Medium'
  const style = options.style

  // 1. Enhance
  const enhanced = await enhance(prompt, systemType, style, size)

  // 2. Research
  const research = await researchPrompt(enhanced)

  // 3. Get knowledge
  const knowledge = getKnowledge(enhanced, systemType, style, size)

  // 4. Library context
  let libraryCtx = ''
  if (supabase) {
    try {
      const { data } = await supabase.from('script_library').select('name,description,luau_code').limit(3)
      if (data?.length) libraryCtx = '\nREUSABLE SCRIPTS:\n' + data.map((s: any) => `// ${s.name}\n${s.luau_code}`).join('\n\n')
    } catch {}
  }

  const fullKnowledge = knowledge + research + libraryCtx

  // 5. Multi-pass specialist agents (parallel where possible)
  const [structureParts, scriptsList] = await Promise.all([
    structureAgent(enhanced, fullKnowledge, size),
    scriptAgent(enhanced, fullKnowledge, systemType),
  ])

  // Interior pass (sequential, uses structure context)
  const interiorParts = await interiorAgent(enhanced, fullKnowledge)

  // Combine all parts
  let allParts = [...structureParts, ...interiorParts]

  // Material refinement pass
  allParts = await materialAgent(enhanced, allParts)

  // Fallback if agents returned nothing
  if (allParts.length === 0) {
    allParts = [{ name: 'Base', size: [10, 1, 10], position: [0, 0, 0], color: [150, 150, 150], material: 'Concrete', anchored: true, transparency: 0 }]
  }

  // 6. Quality check
  const quality = await qualityCheck(enhanced, allParts.length, scriptsList.length)

  // 7. Auto-retry if quality is low — single retry with improved prompt
  let finalParts = allParts
  let finalScripts = scriptsList
  if (quality.score < 65) {
    try {
      const retryKnowledge = `${fullKnowledge}\n\nPREVIOUS ATTEMPT FEEDBACK: ${quality.notes}. Generate more detailed version.`
      const [rParts, rScripts] = await Promise.all([
        structureAgent(enhanced, retryKnowledge, size),
        scriptAgent(enhanced, retryKnowledge, systemType),
      ])
      const rInterior = await interiorAgent(enhanced, retryKnowledge)
      if (rParts.length + rInterior.length > finalParts.length) {
        finalParts = await materialAgent(enhanced, [...rParts, ...rInterior])
        finalScripts = rScripts
      }
    } catch {}
  }

  // 8. Save new scripts to library
  if (supabase && finalScripts.length) {
    for (const s of finalScripts) {
      try {
        await supabase.from('script_library').upsert({
          name: s.name, description: `Auto-generated for: ${prompt}`,
          luau_code: s.source, keywords: [systemType, ...enhanced.split(' ').slice(0, 3)],
          quality_score: quality.score, usage_count: 1,
        }, { onConflict: 'name' })
      } catch {}
    }
  }

  // 9. Save prompt history
  if (supabase && userId) {
    try {
      await supabase.from('prompt_history').insert({
        user_id: userId, prompt, enhanced_prompt: enhanced,
        system_type: systemType, quality_score: quality.score,
      })
    } catch {}
  }

  const spec: SpecItem[] = [
    { label: 'Structural parts', count: structureParts.length, category: 'Structure', added_at: new Date().toISOString() },
    { label: 'Interior parts', count: interiorParts.length, category: 'Interior', added_at: new Date().toISOString() },
    { label: 'Scripts', count: finalScripts.length, category: 'Scripts', added_at: new Date().toISOString() },
    { label: 'Total parts', count: finalParts.length, category: 'Summary', added_at: new Date().toISOString() },
  ]

  const rbxmx = generateRbxmx({ name: prompt, parts: finalParts, scripts: finalScripts })
  if (!rbxmx.includes('<roblox')) throw new Error('Invalid rbxmx output')

  return { rbxmx, spec, qualityScore: quality.score, qualityNotes: quality.notes }
}

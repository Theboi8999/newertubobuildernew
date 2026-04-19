// lib/script-library.ts
// IMPORTANT: This module runs server-side only (called from generator/inngest).
// Uses createAdminClient — never call from client components.

import { groqGenerate } from './groq'
import { createAdminClient } from './supabase'

export interface StoredScript {
  id: string
  name: string
  description: string
  keywords: string[]
  luau_code: string
  usage_count: number
  quality_score: number
  created_at: string
  updated_at: string
}

// Concepts already covered by the static knowledge base — don't try to generate new scripts for these
const KNOWN_MODULES = [
  'helicopter', 'ship', 'boat', 'fire truck', 'car', 'vehicle', 'missile', 'gun', 'rifle',
  'injury', 'medical', 'hunger', 'thirst', 'handcuff', 'arrest', 'booking', 'radio', 'cad',
  'fire', 'flame', 'door', 'elevator', 'garage', 'alarm', 'security camera', 'weather',
  'money', 'shop', 'inventory', 'locker', 'job', 'paycheck', 'hud', 'speedometer',
  'minimap', 'notification', 'compass', 'admin', 'npc', 'civilian', 'traffic',
  'datastore', 'profileservice', 'ragdoll', 'anti-cheat', 'team', 'cutscene',
  'els', 'light bar', 'siren', 'weapon', 'damage', 'defib', 'stretcher',
]

export async function detectMissingScripts(prompt: string): Promise<string[]> {
  try {
    const text = await groqGenerate(
      `You identify scripting concepts needed for a Roblox generation request that are NOT in this list of already-known concepts: ${KNOWN_MODULES.join(', ')}.
Output ONLY a JSON array of short concept strings (2-4 words each). Empty array if nothing new needed.
Example: ["zipline system", "voting gui", "item crafting"]`,
      `Roblox generation prompt: "${prompt}"\nWhat scripting concepts does this need that are NOT in the known list?`,
      400
    )
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function searchLibrary(concept: string): Promise<StoredScript | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('script_library')
      .select('*')
      .or(`name.ilike.%${concept}%,description.ilike.%${concept}%`)
      .order('quality_score', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data as StoredScript
  } catch {
    return null
  }
}

export async function searchLibraryByKeywords(keywords: string[]): Promise<StoredScript[]> {
  try {
    const supabase = createAdminClient()
    const results: StoredScript[] = []

    for (const kw of keywords) {
      const { data } = await supabase
        .from('script_library')
        .select('*')
        .or(`name.ilike.%${kw}%,description.ilike.%${kw}%`)
        .order('quality_score', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        if (!results.find(r => r.id === data[0].id)) {
          results.push(data[0] as StoredScript)
        }
      }
    }

    return results
  } catch {
    return []
  }
}

export async function generateNewScript(concept: string): Promise<StoredScript | null> {
  try {
    const text = await groqGenerate(
      `You are a veteran Roblox Luau scripter. Generate a complete, reusable script pattern for the requested concept.
The script must be:
- Complete and working (no TODOs, no placeholders)
- Written in modern Luau (task.wait not wait(), etc.)
- Anti-exploit safe (damage/important logic on server)
- Well commented
- Reusable as a template

Output ONLY JSON:
{
  "name": "short name (3-5 words)",
  "description": "what this script does (1-2 sentences)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "luau_code": "complete Luau code as a string",
  "quality_score": 85
}`,
      `Generate a complete Roblox Luau script pattern for: "${concept}"`,
      3000
    )
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return await saveToLibrary(parsed)
  } catch {
    return null
  }
}

export async function saveToLibrary(
  script: Omit<StoredScript, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
): Promise<StoredScript | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('script_library')
      .insert({
        name: script.name,
        description: script.description,
        keywords: script.keywords,
        luau_code: script.luau_code,
        quality_score: script.quality_score || 80,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save script to library:', error)
      return null
    }
    return data as StoredScript
  } catch {
    return null
  }
}

export async function incrementUsage(scriptId: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.rpc('increment_script_usage', { script_id: scriptId })
  } catch { /* non-fatal */ }
}

export async function getScriptsForPrompt(
  prompt: string,
  onProgress?: (msg: string) => void
): Promise<{ injectedKnowledge: string; newScriptsGenerated: string[] }> {
  const injectedParts: string[] = []
  const newScriptsGenerated: string[] = []

  const missingConcepts = await detectMissingScripts(prompt)
  if (missingConcepts.length === 0) {
    return { injectedKnowledge: '', newScriptsGenerated: [] }
  }

  onProgress?.(`🔍 Detected ${missingConcepts.length} specialist script(s): ${missingConcepts.join(', ')}`)

  for (const concept of missingConcepts) {
    onProgress?.(`📚 Searching library for: "${concept}"...`)
    const existing = await searchLibrary(concept)

    if (existing) {
      onProgress?.(`✅ Found in library: "${existing.name}" (used ${existing.usage_count} times)`)
      injectedParts.push(`
=== LIBRARY SCRIPT: ${existing.name} ===
${existing.description}

${existing.luau_code}
=== END: ${existing.name} ===`)
      await incrementUsage(existing.id)
    } else {
      onProgress?.(`⚡ Generating new script for: "${concept}"...`)
      const newScript = await generateNewScript(concept)
      if (newScript) {
        onProgress?.(`💾 Saved "${newScript.name}" to library`)
        injectedParts.push(`
=== NEW SCRIPT: ${newScript.name} ===
${newScript.description}

${newScript.luau_code}
=== END: ${newScript.name} ===`)
        newScriptsGenerated.push(newScript.name)
      }
    }
  }

  return { injectedKnowledge: injectedParts.join('\n\n'), newScriptsGenerated }
}

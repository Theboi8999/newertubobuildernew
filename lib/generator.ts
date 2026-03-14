// lib/generator.ts — Main generation pipeline using Groq

import { groqGenerate } from './groq'
import { getKnowledgeContext } from './knowledge'
import { generateRbxmx } from './rbxmx'

export interface GenerationResult {
  rbxmx: string
  spec: SpecItem[]
  qualityScore: number
  qualityNotes: string
}

export interface SpecItem {
  label: string
  count: number
  category: string
  added_at: string
}

export async function generateAsset(
  prompt: string,
  systemType: 'builder' | 'modeling' | 'project'
): Promise<GenerationResult> {
  const knowledge = getKnowledgeContext(prompt, systemType)

  const systemPrompt = `You are TurboBuilder — an expert Roblox Studio asset generator with 10 years of professional experience.
You generate detailed, prestige-quality Roblox assets as structured JSON that gets converted to .rbxmx files.

${knowledge}

CRITICAL RULES:
- Generate exactly what is asked for. If the prompt says "a police car", generate ONE police car, not many.
- If the prompt says "a block of apartments", generate the full block.
- Every asset must be prestige quality — the kind a veteran developer would be proud of.
- Always output valid JSON only — no markdown, no explanations, just the JSON object.`

  const userPrompt = `Generate a prestige-quality Roblox asset for: "${prompt}"

Return ONLY a JSON object with this exact structure:
{
  "name": "Asset name",
  "description": "Brief description",
  "parts": [
    {
      "name": "PartName",
      "className": "Part",
      "size": [x, y, z],
      "position": [x, y, z],
      "color": [r, g, b],
      "material": "SmoothPlastic",
      "anchored": true,
      "transparency": 0
    }
  ],
  "scripts": [
    {
      "name": "ScriptName",
      "type": "Script",
      "source": "-- Lua code here"
    }
  ],
  "spec": [
    { "label": "Feature name", "count": 1, "category": "Structure" }
  ],
  "qualityScore": 85,
  "qualityNotes": "Brief notes on quality"
}

Materials must be valid Roblox materials: SmoothPlastic, Brick, Concrete, Metal, Wood, Neon, Glass, Fabric, DiamondPlate, Foil, Granite, Marble, Pebble, Sand, Slate, WoodPlanks, Cobblestone, CorrodedMetal.
Colors are RGB 0-255.
Generate AT LEAST 20 parts for buildings, 15 for vehicles, 10 for tools.
Make it detailed and realistic.`

  let rawJson = ''
  try {
    rawJson = await groqGenerate(systemPrompt, userPrompt)
  } catch (e: unknown) {
    throw new Error(`Generation failed: ${e instanceof Error ? e.message : String(e)}`)
  }

  // Extract JSON from response
  let parsed: {
    name?: string
    parts?: unknown[]
    scripts?: Array<{ name: string; type: string; source: string }>
    spec?: Array<{ label: string; count: number; category: string }>
    qualityScore?: number
    qualityNotes?: string
  }
  try {
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    // Fallback — return a placeholder so the generation doesn't fully fail
    parsed = {
      name: prompt,
      parts: [],
      scripts: [],
      spec: [{ label: 'Generation attempted', count: 1, category: 'Info' }],
      qualityScore: 50,
      qualityNotes: 'JSON parsing failed — try a more specific prompt',
    }
  }

  const spec: SpecItem[] = (parsed.spec || []).map((s) => ({
    label: s.label,
    count: s.count,
    category: s.category,
    added_at: new Date().toISOString(),
  }))

  const rbxmx = generateRbxmx({
    name: parsed.name || prompt,
    parts: (parsed.parts || []) as Parameters<typeof generateRbxmx>[0]['parts'],
    scripts: parsed.scripts || [],
  })

  return {
    rbxmx,
    spec,
    qualityScore: parsed.qualityScore || 75,
    qualityNotes: parsed.qualityNotes || '',
  }
}

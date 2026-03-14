import Anthropic from '@anthropic-ai/sdk'
import { getKnowledgeForSystem } from './knowledge/index'
import { getScriptsForPrompt } from './script-library'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface SceneAsset {
  name: string
  type: 'builder' | 'modeling' | 'project'
  prompt: string
  position: { x: number; y: number; z: number }
  dependencies: string[]
}

export interface ScenePlan {
  title: string
  description: string
  assets: SceneAsset[]
  sharedScripts: string[]
}

// Parse a complex scene description into individual assets
export async function parseSceneDescription(prompt: string): Promise<ScenePlan> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You parse complex Roblox scene descriptions into individual asset generation tasks.
Break down the scene into separate assets, determine what type each is (builder/modeling/project),
and identify dependencies between them (e.g. a police car needs the police station first for context).
Position assets logically in 3D space (Y=0 is ground level, space assets realistically).
Output ONLY JSON — no markdown.`,
    messages: [{
      role: 'user',
      content: `Parse this scene into individual assets:
"${prompt}"

Output JSON:
{
  "title": "scene name",
  "description": "what this scene is",
  "assets": [
    {
      "name": "asset name",
      "type": "builder|modeling|project",
      "prompt": "detailed generation prompt for this specific asset",
      "position": {"x": 0, "y": 0, "z": 0},
      "dependencies": ["name of asset this depends on, if any"]
    }
  ],
  "sharedScripts": ["script system needed across all assets"]
}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// Detect what other systems a generation depends on and auto-generate them
export async function resolveDependencies(
  prompt: string,
  systemType: string
): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: `You identify Roblox game system dependencies.
Given a generation request, identify what other systems MUST exist for this to work.
Example: "booking system" depends on ["currency system", "datastore", "team system"]
Output ONLY JSON array of dependency names. Empty array if no dependencies.`,
      messages: [{
        role: 'user',
        content: `What systems does this depend on: "${prompt}" (system type: ${systemType})`
      }]
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

// Get missing dependencies from the script library and auto-generate them
export async function autoResolveDependencies(
  prompt: string,
  systemType: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  const deps = await resolveDependencies(prompt, systemType)
  if (deps.length === 0) return ''

  onProgress?.(`🔗 Resolving ${deps.length} dependencies: ${deps.join(', ')}`)

  const parts: string[] = []
  for (const dep of deps) {
    const { injectedKnowledge } = await getScriptsForPrompt(dep, onProgress)
    if (injectedKnowledge) parts.push(injectedKnowledge)
  }

  return parts.join('\n\n')
}

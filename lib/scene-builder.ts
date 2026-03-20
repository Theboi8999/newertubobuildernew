import { geminiGenerate } from './groq'
import { getScriptsForPrompt } from './script-library'

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

export async function parseSceneDescription(prompt: string): Promise<ScenePlan> {
  const text = await geminiGenerate(
    `You parse complex Roblox scene descriptions into individual asset generation tasks.
Break down the scene into separate assets, determine what type each is (builder/modeling/project),
and identify dependencies between them.
Position assets logically in 3D space (Y=0 is ground level).
Output ONLY JSON — no markdown.`,
    `Parse this scene into individual assets:
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
}`,
    2000
  )
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function resolveDependencies(prompt: string, systemType: string): Promise<string[]> {
  try {
    const text = await geminiGenerate(
      `You identify Roblox game system dependencies.
Given a generation request, identify what other systems MUST exist for this to work.
Output ONLY JSON array of dependency names. Empty array if no dependencies.`,
      `What systems does this depend on: "${prompt}" (system type: ${systemType})`,
      400
    )
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

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

import { geminiGenerate } from './groq'

export async function enhancePrompt(prompt: string, systemType: string): Promise<string> {
  try {
    const text = await geminiGenerate(
      `You enhance Roblox asset generation prompts to be more specific and detailed.
Add relevant detail about scale, materials, style, and features based on context.
Keep the same intent but make it richer. Output ONLY the enhanced prompt string — no explanation.`,
      `Enhance this ${systemType} prompt: "${prompt}"`,
      300
    )
    return text.trim() || prompt
  } catch {
    return prompt
  }
}

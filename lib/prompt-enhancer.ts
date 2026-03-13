import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function enhancePrompt(prompt: string, systemType: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You enhance Roblox asset generation prompts to be more specific and detailed.
Add relevant detail about scale, materials, style, and features based on context.
Keep the same intent but make it richer. Output ONLY the enhanced prompt string — no explanation.`,
      messages: [{ role: 'user', content: `Enhance this ${systemType} prompt: "${prompt}"` }]
    })
    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : prompt
    return text || prompt
  } catch {
    return prompt
  }
}

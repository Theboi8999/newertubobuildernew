import { geminiGenerate } from './groq'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  tosIssues: string[]
  fixed?: string
}

export function validateRbxmx(rbxmx: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const tosIssues: string[] = []

  if (!rbxmx.includes('<roblox')) errors.push('Missing <roblox> root element')
  if (!rbxmx.includes('</roblox>')) errors.push('Missing closing </roblox> tag')
  if (!rbxmx.includes('<Item class="Model"')) warnings.push('No Model item found — may not import correctly')

  const openTags = (rbxmx.match(/<[A-Za-z]+[^/]>/g) || []).length
  const closeTags = (rbxmx.match(/<\/[A-Za-z]+>/g) || []).length
  if (Math.abs(openTags - closeTags) > 5) {
    warnings.push(`Possible unclosed XML tags detected (${openTags} open, ${closeTags} close)`)
  }

  const tosPatterns = [
    { pattern: /getfenv|setfenv/i, issue: 'getfenv/setfenv usage — blocked by Roblox' },
    { pattern: /loadstring/i, issue: 'loadstring usage — blocked in Roblox (unless enabled in settings)' },
    { pattern: /while true do[\s\S]{0,20}end/i, issue: 'Infinite loop without task.wait — will crash server' },
  ]

  for (const { pattern, issue } of tosPatterns) {
    if (pattern.test(rbxmx)) tosIssues.push(issue)
  }

  const sizeKB = Buffer.byteLength(rbxmx, 'utf8') / 1024
  if (sizeKB > 5000) warnings.push(`File is very large (${Math.round(sizeKB)}KB) — may be slow to import`)
  if (sizeKB < 1) errors.push('File appears empty')

  let fixed = rbxmx
  if (!fixed.startsWith('<?xml')) {
    fixed = '<?xml version="1.0" encoding="utf-8"?>\n' + fixed
  }
  fixed = fixed.replace(/while true do\n(\s+)(?!task\.wait)/g, 'while true do\n$1task.wait(0.1)\n$1')

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tosIssues,
    fixed: fixed !== rbxmx ? fixed : undefined,
  }
}

export async function checkScriptTOS(scriptSource: string): Promise<{ safe: boolean; issues: string[] }> {
  try {
    const text = await geminiGenerate(
      `You check Roblox Luau scripts for Roblox Terms of Service violations and exploits.
Output ONLY JSON: {"safe": boolean, "issues": ["issue1", "issue2"]}`,
      `Check this script:\n${scriptSource.slice(0, 2000)}`,
      300
    )
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { safe: true, issues: [] }
  }
}

export function watermarkRbxmx(rbxmx: string, generationId: string, userId: string): string {
  const watermark = `<!-- TurboBuilder Generation ID: ${generationId} | User: ${userId} | Generated: ${new Date().toISOString()} -->`
  return rbxmx.replace('<?xml version="1.0" encoding="utf-8"?>', `<?xml version="1.0" encoding="utf-8"?>\n${watermark}`)
}

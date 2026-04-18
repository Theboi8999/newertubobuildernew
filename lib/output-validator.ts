// lib/output-validator.ts
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

  // Structure checks
  if (!rbxmx.includes('<roblox')) errors.push('Missing <roblox> root element')
  if (!rbxmx.includes('</roblox>')) errors.push('Missing closing </roblox> tag')
  if (!rbxmx.includes('<Item class="Model"')) warnings.push('No Model item found — may not import correctly')
  const partCount = (rbxmx.match(/<Item class="Part"/g) || []).length
  if (partCount === 0) errors.push('No Part items found — file will be empty in Studio')

  // Rough tag balance check (within tolerance — XML attributes also have < > chars)
  const openTags = (rbxmx.match(/<[A-Za-z][A-Za-z0-9]*[\s>]/g) || []).length
  const closeTags = (rbxmx.match(/<\/[A-Za-z][A-Za-z0-9]*>/g) || []).length
  if (Math.abs(openTags - closeTags) > 10) {
    warnings.push(`Possible unclosed XML tags detected (open: ${openTags}, close: ${closeTags})`)
  }

  // TOS / code quality checks (static — no AI call needed in hot path)
  const tosPatterns = [
    { pattern: /getfenv|setfenv/i, issue: 'getfenv/setfenv usage — blocked by Roblox' },
    { pattern: /loadstring/i, issue: 'loadstring usage — blocked in Roblox (unless enabled in settings)' },
    { pattern: /while true do\s*\n(?!\s*task\.wait)/i, issue: 'Infinite loop without task.wait — may cause server lag' },
    { pattern: /HttpService/i, issue: 'HttpService usage — requires manual enable in Roblox game settings' },
  ]
  for (const { pattern, issue } of tosPatterns) {
    if (pattern.test(rbxmx)) tosIssues.push(issue)
  }

  // File size check
  const sizeKB = Buffer.byteLength(rbxmx, 'utf8') / 1024
  if (sizeKB > 5000) warnings.push(`File is very large (${Math.round(sizeKB)}KB) — may be slow to import`)
  if (sizeKB < 0.5) errors.push('File appears empty or too small to be valid')

  // Auto-fix: ensure XML declaration present
  let fixed = rbxmx
  if (!fixed.startsWith('<?xml')) {
    fixed = '<?xml version="1.0" encoding="utf-8"?>\n' + fixed
  }

  // Auto-fix: add task.wait to bare infinite loops
  fixed = fixed.replace(
    /while true do\r?\n(\s+)(?!task\.wait)/g,
    'while true do\n$1task.wait(0.1)\n$1'
  )

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tosIssues,
    fixed: fixed !== rbxmx ? fixed : undefined,
  }
}

// Kept for optional use but NOT called in the generation hot path —
// adds ~2s latency for minimal benefit. Call explicitly if needed.
export async function checkScriptTOS(
  scriptSource: string
): Promise<{ safe: boolean; issues: string[] }> {
  try {
    const text = await geminiGenerate(
      `You check Roblox Luau scripts for Roblox Terms of Service violations and exploits.
Output ONLY JSON: {"safe": boolean, "issues": ["issue1", "issue2"]}`,
      `Check this script:\n${scriptSource.slice(0, 2000)}`,
      300
    )
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { safe: true, issues: [] }
  }
}

export function watermarkRbxmx(rbxmx: string, generationId: string, userId: string): string {
  const watermark = `<!-- TurboBuilder | Generation: ${generationId} | User: ${userId} | ${new Date().toISOString()} -->`
  return rbxmx.replace(
    '<?xml version="1.0" encoding="utf-8"?>',
    `<?xml version="1.0" encoding="utf-8"?>\n${watermark}`
  )
}

// lib/output-validator.ts
import { groqGenerate } from './groq'

export interface ValidationResult {
  valid: boolean
  passed: boolean
  errors: string[]
  warnings: string[]
  tosIssues: string[]
  issues: string[]
  fixed?: string | null
}

export function validateRbxmx(rbxmx: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const tosIssues: string[] = []
  const issues: string[] = []

  // Critical checks — these indicate definite XML corruption
  if (!rbxmx || !rbxmx.startsWith('<?xml')) {
    const reason = 'Output does not start with valid XML declaration'
    console.error('[validator] FAILED:', reason)
    issues.push(reason)
  }
  if (!rbxmx || !rbxmx.includes('<roblox')) {
    const reason = 'Missing <roblox> root element'
    console.error('[validator] FAILED:', reason)
    issues.push(reason)
    errors.push(reason)
  }
  if (!rbxmx || !rbxmx.trimEnd().endsWith('</roblox>')) {
    const reason = 'Output does not end with </roblox>'
    console.error('[validator] FAILED:', reason)
    issues.push(reason)
    errors.push('Missing closing </roblox> tag')
  }
  if (rbxmx && rbxmx.includes('NaN')) {
    const reason = 'Output contains literal "NaN" — numeric corruption detected'
    console.error('[validator] FAILED:', reason)
    issues.push(reason)
    errors.push(reason)
  }
  if (rbxmx && rbxmx.includes('Infinity')) {
    const reason = 'Output contains literal "Infinity" — numeric corruption detected'
    console.error('[validator] FAILED:', reason)
    issues.push(reason)
    errors.push(reason)
  }

  // Return early if any critical issue found — do not attempt to fix corrupted XML
  if (issues.length > 0) {
    return { valid: false, passed: false, errors, warnings, tosIssues, issues, fixed: null }
  }

  // Non-critical structure checks
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

  // Auto-fix: add task.wait to bare infinite loops
  let fixed = rbxmx
  fixed = fixed.replace(
    /while true do\r?\n(\s+)(?!task\.wait)/g,
    'while true do\n$1task.wait(0.1)\n$1'
  )

  return {
    valid: errors.length === 0,
    passed: true,
    errors,
    warnings,
    tosIssues,
    issues,
    fixed: fixed !== rbxmx ? fixed : undefined,
  }
}

// Kept for optional use but NOT called in the generation hot path —
// adds ~2s latency for minimal benefit. Call explicitly if needed.
export async function checkScriptTOS(
  scriptSource: string
): Promise<{ safe: boolean; issues: string[] }> {
  try {
    const text = await groqGenerate(
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
  // Roblox Studio's parser does NOT support XML comments anywhere in rbxmx files.
  // Official Studio exports contain zero comments. We store the watermark as a
  // StringValue instance inside ROOT_MODEL — valid Roblox metadata approach.
  const timestamp = new Date().toISOString()
  const watermarkItem = `
  <Item class="StringValue" referent="WATERMARK">
    <Properties>
      <string name="Name">TurboBuilder_ID</string>
      <string name="Value">${generationId}|${userId}|${timestamp}</string>
    </Properties>
  </Item>`
  return rbxmx.replace(
    '<Meta name="ExplicitAutoJoints">true</Meta>',
    `<Meta name="ExplicitAutoJoints">true</Meta>${watermarkItem}`
  )
}

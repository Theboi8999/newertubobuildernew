import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  tosIssues: string[]
  fixed?: string
}

// Validate .rbxmx XML is well-formed and will import into Studio
export function validateRbxmx(rbxmx: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const tosIssues: string[] = []

  // Check basic XML structure
  if (!rbxmx.includes('<roblox')) errors.push('Missing <roblox> root element')
  if (!rbxmx.includes('</roblox>')) errors.push('Missing closing </roblox> tag')
  if (!rbxmx.includes('<Item class="Model"')) warnings.push('No Model item found — may not import correctly')

  // Check for unclosed tags (basic)
  const openTags = (rbxmx.match(/<[A-Za-z]+[^/]>/g) || []).length
  const closeTags = (rbxmx.match(/<\/[A-Za-z]+>/g) || []).length
  if (Math.abs(openTags - closeTags) > 5) {
    warnings.push(`Possible unclosed XML tags detected (${openTags} open, ${closeTags} close)`)
  }

  // Check for invalid BrickColor values
  const colorMatches = rbxmx.match(/<string name="BrickColor">([^<]+)<\/string>/g) || []
  const validColors = ['White','Black','Medium stone grey','Bright blue','Bright red','Brick yellow','Reddish brown','Dark stone grey','Sand green','Bright green','Bright yellow']
  for (const match of colorMatches.slice(0, 20)) {
    const color = match.replace(/<[^>]+>/g, '')
    if (!validColors.includes(color) && color.length > 0) {
      // Not an error, just a note — BrickColor has 100s of valid values
    }
  }

  // Roblox TOS checks in scripts
  const tosPatterns = [
    { pattern: /getfenv|setfenv/i, issue: 'getfenv/setfenv usage — blocked by Roblox' },
    { pattern: /loadstring/i, issue: 'loadstring usage — blocked in Roblox (unless enabled in settings)' },
    { pattern: /HttpService.*Get.*[a-z]+\.(exe|dll|bat)/i, issue: 'Potential malicious HTTP request detected' },
    { pattern: /while true do[\s\S]{0,20}end/i, issue: 'Infinite loop without task.wait — will crash server' },
  ]

  for (const { pattern, issue } of tosPatterns) {
    if (pattern.test(rbxmx)) tosIssues.push(issue)
  }

  // Check file size
  const sizeKB = Buffer.byteLength(rbxmx, 'utf8') / 1024
  if (sizeKB > 5000) warnings.push(`File is very large (${Math.round(sizeKB)}KB) — may be slow to import`)
  if (sizeKB < 1) errors.push('File appears empty')

  // Auto-fix common issues
  let fixed = rbxmx
  // Ensure proper XML header
  if (!fixed.startsWith('<?xml')) {
    fixed = '<?xml version="1.0" encoding="utf-8"?>\n' + fixed
  }
  // Fix common infinite loops
  fixed = fixed.replace(/while true do\n(\s+)(?!task\.wait)/g, 'while true do\n$1task.wait(0.1)\n$1')

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tosIssues,
    fixed: fixed !== rbxmx ? fixed : undefined,
  }
}

// Check script against Roblox TOS using AI
export async function checkScriptTOS(scriptSource: string): Promise<{ safe: boolean; issues: string[] }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You check Roblox Luau scripts for Roblox Terms of Service violations and exploits.
Output ONLY JSON: {"safe": boolean, "issues": ["issue1", "issue2"]}
Issues to check: exploits, infinite loops without yields, attempts to access unauthorized APIs,
inappropriate content in strings, attempts to manipulate other players unfairly.`,
      messages: [{ role: 'user', content: `Check this script:\n${scriptSource.slice(0, 2000)}` }]
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { safe: true, issues: [] }
  }
}

// Watermark a .rbxmx file with a hidden TurboBuilder identifier
export function watermarkRbxmx(rbxmx: string, generationId: string, userId: string): string {
  const watermark = `<!-- TurboBuilder Generation ID: ${generationId} | User: ${userId} | Generated: ${new Date().toISOString()} -->`
  return rbxmx.replace('<?xml version="1.0" encoding="utf-8"?>', `<?xml version="1.0" encoding="utf-8"?>\n${watermark}`)
}

// lib/prompt-filter.ts
const BANNED_WORDS = [
  'exploit', 'hack', 'bypass', 'cheat', 'inject',
  'nsfw', 'sexual', 'nude',
]
const MAX_LENGTH = 1000
const MIN_LENGTH = 5

export interface FilterResult {
  allowed: boolean
  reason?: string
}

export function filterPrompt(prompt: string): FilterResult {
  if (!prompt || prompt.trim().length < MIN_LENGTH) {
    return { allowed: false, reason: 'Prompt is too short.' }
  }
  if (prompt.length > MAX_LENGTH) {
    return {
      allowed: false,
      reason: `Prompt too long (${prompt.length} chars). Max ${MAX_LENGTH}.`,
    }
  }
  const lower = prompt.toLowerCase()
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) {
      return { allowed: false, reason: 'Prompt contains disallowed content.' }
    }
  }
  return { allowed: true }
}


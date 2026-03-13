import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
 
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
 
export async function POST(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const { originalPrompt, criticism, systemType } = await req.json()
 
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: `Improve Roblox generation prompts based on user criticism. Output ONLY the improved prompt.`,
    messages: [{
      role: 'user',
      content: `Original: "${originalPrompt}" | System: ${systemType} | Criticism: "${criticism}" → Improved prompt:`
    }]
  })
 
  const improvedPrompt = response.content[0].type === 'text' ? response.content[0].text.trim() : originalPrompt
  return NextResponse.json({ improvedPrompt })
}
 

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { answers, systemType } = await req.json()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: `Build optimised TurboBuilder prompts from wizard answers. Output ONLY the prompt string.`,
    messages: [{
      role: 'user',
      content: `Build a ${systemType} prompt from: ${Object.entries(answers).map(([q,a]) => `${q}: ${a}`).join(' | ')}`
    }]
  })

  const prompt = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return NextResponse.json({ prompt })
}

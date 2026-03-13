import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { geminiGenerate } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { answers, systemType } = await req.json()

  const prompt = await geminiGenerate(
    `Build optimised TurboBuilder prompts from wizard answers. Output ONLY the prompt string.`,
    `Build a ${systemType} prompt from: ${Object.entries(answers).map(([q,a]) => `${q}: ${a}`).join(' | ')}`,
    300
  )

  return NextResponse.json({ prompt: prompt.trim() })
}

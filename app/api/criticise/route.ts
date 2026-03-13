import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { geminiGenerate } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { originalPrompt, criticism, systemType } = await req.json()

  const improvedPrompt = await geminiGenerate(
    `Improve Roblox generation prompts based on user criticism. Output ONLY the improved prompt.`,
    `Original: "${originalPrompt}" | System: ${systemType} | Criticism: "${criticism}" → Improved prompt:`,
    400
  )

  return NextResponse.json({ improvedPrompt: improvedPrompt.trim() || originalPrompt })
}

// app/api/criticise/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerate } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { originalPrompt, criticism, systemType } = await req.json()

    if (!originalPrompt || !criticism) {
      return NextResponse.json({ error: 'Missing originalPrompt or criticism' }, { status: 400 })
    }

    const result = await geminiGenerate(
      'You improve Roblox asset generation prompts based on user feedback. Output ONLY the improved prompt string — no explanation, no quotes, no preamble.',
      `Original prompt: "${originalPrompt}"

User feedback about what was wrong: "${criticism}"

System type: ${systemType}

Rewrite the prompt to address all the feedback while keeping the original intent. Be specific about the things the user wants fixed. The improved prompt should still generate a ${systemType} asset.`,
      500
    )

    return NextResponse.json({ improvedPrompt: result.trim() })
  } catch (err: any) {
    console.error('Criticise error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// app/api/wizard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerate } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { answers, systemType } = await req.json()

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Missing answers' }, { status: 400 })
    }

    const answerText = Object.entries(answers)
      .map(([q, a]) => `${q}: ${a}`)
      .join('\n')

    const result = await geminiGenerate(
      'You convert wizard answers into a single detailed Roblox asset generation prompt. Output ONLY the prompt string — no explanation, no quotes, no preamble.',
      `System type: ${systemType}\n\nUser wizard answers:\n${answerText}\n\nWrite a detailed, specific Roblox ${systemType} generation prompt based on these answers. Include key features, style, and any special requirements mentioned.`,
      400
    )

    return NextResponse.json({ prompt: result.trim() })
  } catch (err: any) {
    console.error('Wizard error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


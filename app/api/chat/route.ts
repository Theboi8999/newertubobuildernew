import { NextRequest, NextResponse } from 'next/server'
import { processMessage } from '../../../lib/brain/conversational-brain'
import { createDefaultIntent, BuildIntent } from '../../../lib/brain/build-intent'

export async function POST(req: NextRequest) {
  try {
    const { message, intent, history } = await req.json()

    const currentIntent: BuildIntent = intent || createDefaultIntent(message)

    const result = await processMessage(message, currentIntent, history || [])

    return NextResponse.json({
      reply: result.reply,
      intent: result.updatedIntent,
      readyToGenerate: result.readyToGenerate,
    })
  } catch (e: any) {
    console.error('[chat] error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

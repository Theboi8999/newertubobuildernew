import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VISUAL_FIX_PROMPT = `You are a Roblox building expert. Compare these two buildings.
Image 1 is the generated building. Image 2 is the target.
List every visual difference you can see:
- Colors (be specific with Roblox BrickColor names)
- Proportions and sizes
- Roof shape and position
- Stone base height and texture
- Window appearance
- Any missing elements

Then output SPECIFIC code changes needed in this format:
CHANGE: [what to change] → [exact new value]`

export async function POST(req: NextRequest) {
  try {
    const { generatedImage, targetImage } = await req.json()

    if (!generatedImage || !targetImage) {
      return NextResponse.json({ error: 'Both generatedImage and targetImage are required' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: generatedImage },
            },
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: targetImage },
            },
            { type: 'text', text: VISUAL_FIX_PROMPT },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract CHANGE lines for easy parsing
    const changes = text
      .split('\n')
      .filter(l => l.trim().startsWith('CHANGE:'))
      .map(l => l.replace(/^CHANGE:\s*/, '').trim())

    return NextResponse.json({ analysis: text, changes })
  } catch (e: any) {
    console.error('[visual-fix]', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

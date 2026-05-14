import { groqGenerate } from '../groq'
import { BuildIntent, getNextQuestion, isIntentComplete } from './build-intent'

const BRAIN_SYSTEM = `You are TurboBuilder's architect brain.
Your job is to understand what the user wants to build.
You ask ONE question at a time maximum.
You are friendly, brief, and smart.
You extract building information from casual descriptions.

Extract these from the user message if present:
- buildingType: what kind of building
- region: country/city if mentioned
- era: time period if mentioned
- floorCount: number of floors
- style: realistic/stylized/cartoony
- mode: exterior/full
- specialRequests: any specific features mentioned

Return JSON only:
{
  "understood": "brief description of what you understood",
  "buildingType": "extracted type or empty string",
  "region": "extracted region or empty string",
  "era": "extracted era or empty string",
  "floorCount": 0,
  "style": "",
  "mode": "",
  "specialRequests": [],
  "confidence": 0.0,
  "readyToGenerate": false,
  "nextQuestion": ""
}`

export async function processMessage(
  message: string,
  intent: BuildIntent,
  history: { role: string; content: string }[]
): Promise<{
  reply: string
  updatedIntent: BuildIntent
  readyToGenerate: boolean
}> {
  const userPrompt = `
Conversation history:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

Latest message: ${message}
Current intent: ${JSON.stringify(intent)}

Extract any building information from the message.
Determine if we have enough to generate.
If not, what single question should we ask next?`

  try {
    const result = await groqGenerate(BRAIN_SYSTEM, userPrompt, 400)
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('no JSON')
    const parsed = JSON.parse(cleaned.substring(start, end + 1))

    const updatedIntent: BuildIntent = {
      ...intent,
      buildingType: parsed.buildingType || intent.buildingType,
      region: parsed.region || intent.region,
      era: parsed.era || intent.era,
      floorCount: parsed.floorCount || intent.floorCount,
      style: parsed.style || intent.style,
      mode: parsed.mode || intent.mode,
      specialRequests: [...intent.specialRequests, ...(parsed.specialRequests || [])],
      confidence: parsed.confidence,
      questionsAsked: intent.questionsAsked + (parsed.nextQuestion ? 1 : 0),
    }

    const readyToGenerate = parsed.readyToGenerate || isIntentComplete(updatedIntent)

    let reply: string = parsed.understood || ''
    if (!readyToGenerate && parsed.nextQuestion) {
      reply = parsed.nextQuestion
    } else if (readyToGenerate) {
      reply = `Perfect! Building a ${updatedIntent.buildingType || message}. Generating now...`
    }

    return { reply, updatedIntent, readyToGenerate }
  } catch (e) {
    console.error('[brain] error:', e)
    return {
      reply: 'Got it! Let me build that for you.',
      updatedIntent: { ...intent, complete: true },
      readyToGenerate: true,
    }
  }
}

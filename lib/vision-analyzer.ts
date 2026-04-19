// lib/vision-analyzer.ts
export interface QualityTarget {
  partDensity: 'low' | 'medium' | 'high' | 'ultra'
  colorPalette: string[]
  lightingStyle: 'bright' | 'warm' | 'cool' | 'dark'
  interiorStyle: 'modern' | 'realistic' | 'stylized' | 'minimal'
  detailLevel: number
  notes: string
}

const DEFAULT_TARGET: QualityTarget = {
  partDensity: 'medium',
  colorPalette: [],
  lightingStyle: 'warm',
  interiorStyle: 'realistic',
  detailLevel: 5,
  notes: 'Default quality target',
}

const VISION_PROMPT =
  'Analyze this Roblox build screenshot. Extract: 1) Part density (how many parts/detail level: low/medium/high/ultra), 2) Color palette (list up to 5 dominant Roblox BrickColor names), 3) Lighting style (bright/warm/cool/dark), 4) Interior style (modern/realistic/stylized/minimal), 5) Detail level score 1-10. Respond ONLY with JSON: {"partDensity":"high","colorPalette":["White","Light grey","Reddish brown"],"lightingStyle":"warm","interiorStyle":"realistic","detailLevel":8,"notes":"brief description"}'

export async function analyzeRobloxReference(imageBase64: string, mimeType: string): Promise<QualityTarget> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-xxxxx') {
    console.log('[vision] ANTHROPIC_API_KEY not set, skipping vision analysis')
    return { partDensity: 'medium', colorPalette: [], lightingStyle: 'bright', interiorStyle: 'realistic', detailLevel: 5, notes: 'vision disabled' }
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            { type: 'text', text: VISION_PROMPT },
          ],
        }],
      }),
    })

    if (!res.ok) {
      console.error('[vision-analyzer] Anthropic API error:', res.status, await res.text())
      return DEFAULT_TARGET
    }

    const data = await res.json()
    const content = data.content?.[0]?.text
    if (!content) return DEFAULT_TARGET

    const cleaned = content.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    return { ...DEFAULT_TARGET, ...parsed }
  } catch (e) {
    console.error('[vision-analyzer] analyzeRobloxReference error:', e)
    return DEFAULT_TARGET
  }
}

export async function findIRLReferences(buildingType: string): Promise<string[]> {
  if (!process.env.SERPER_API_KEY) return []

  const humanName = buildingType.replace(/_/g, ' ')
  const urls: string[] = []

  const queries = [
    `${humanName} interior architecture floor plan`,
    `${humanName} floor plan layout architecture`,
  ]

  for (const q of queries) {
    try {
      const res = await fetch('https://google.serper.dev/images', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q, num: 5 }),
      })
      if (res.ok) {
        const data = await res.json()
        const resultUrls: string[] = (data.images || [])
          .map((r: any) => r.imageUrl || r.link)
          .filter(Boolean)
        urls.push(...resultUrls)
      }
    } catch (e) {
      console.error('[vision-analyzer] findIRLReferences error:', e)
    }
  }

  return urls.slice(0, 8)
}

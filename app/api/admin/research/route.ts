import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { geminiGenerate } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { topic } = await req.json()
  const admin = createAdminClient()

  // Log the research run
  const { data: log } = await admin.from('research_logs').insert({
    topic,
    status: 'researching',
    findings: 'Starting research...',
  }).select().single()

  try {
    // Use AI to generate structured knowledge about this topic
    const researchPrompt = `You are a Roblox building expert researcher. Research this topic thoroughly: "${topic}"

Generate comprehensive knowledge for a Roblox builder including:
1. Typical layout and floor plan
2. Key rooms/areas and their contents
3. Accurate real-world dimensions (converted to Roblox studs where 1 stud = 0.28m)
4. Color schemes and materials used
5. Unique features specific to this building type
6. Equipment and furniture lists
7. Exterior features

Output as JSON array with each fact as a separate entry:
[
  {"topic": "${topic}", "category": "building", "content": "detailed fact here", "source": "AI Research", "quality_score": 85},
  {"topic": "${topic}", "category": "building", "content": "another fact", "source": "AI Research", "quality_score": 85}
]

Generate 8-12 detailed, useful facts. Output ONLY the JSON array.`

    const result = await geminiGenerate(
      'You are an expert researcher for Roblox building knowledge. Output ONLY valid JSON arrays.',
      researchPrompt,
      3000
    )

    const clean = result.replace(/```json|```/g, '').trim()
    const entries = JSON.parse(clean)

    if (!Array.isArray(entries) || entries.length === 0) throw new Error('No entries returned')

    // Save all knowledge entries
    await admin.from('ai_knowledge').insert(entries.map((e: any) => ({
      topic: e.topic || topic,
      category: e.category || 'building',
      content: e.content,
      source: e.source || 'AI Research',
      quality_score: e.quality_score || 80,
      times_used: 0,
    })))

    // Update research log
    await admin.from('research_logs').update({
      status: 'complete',
      findings: `Learned ${entries.length} facts: ${entries.slice(0,3).map((e:any) => e.content?.slice(0,50)).join(' | ')}...`
    }).eq('id', log?.id)

    return NextResponse.json({ success: true, entries: entries.length })

  } catch (err: any) {
    await admin.from('research_logs').update({
      status: 'failed',
      findings: `Error: ${err.message}`
    }).eq('id', log?.id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

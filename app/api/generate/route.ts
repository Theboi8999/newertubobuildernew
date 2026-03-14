import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateAsset } from '@/lib/generator'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  let generationId: string | undefined

  try {
    const body = await req.json()
    generationId = body.generationId
    const { prompt, systemType, userId, style, size, variation } = body

    if (!generationId || !prompt || !systemType)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    await supabase.from('generations').update({ status: 'researching', progress: 10 }).eq('id', generationId)
    await supabase.from('generations').update({ status: 'enhancing', progress: 25 }).eq('id', generationId)
    await supabase.from('generations').update({ status: 'generating', progress: 45 }).eq('id', generationId)

    const result = await generateAsset(prompt, systemType, { style, size, variation }, userId, supabase)

    await supabase.from('generations').update({ status: 'checking', progress: 85 }).eq('id', generationId)

    const fileName = `${generationId}.rbxmx`
    let outputUrl = null
    const { error: uploadErr } = await supabase.storage.from('generations').upload(fileName, result.rbxmx, { contentType: 'text/xml', upsert: true })
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('generations').getPublicUrl(fileName)
      outputUrl = urlData.publicUrl
    }

    await supabase.from('generations').update({
      status: 'complete', progress: 100,
      spec_items: result.spec, output_url: outputUrl,
      output_metadata: { qualityScore: result.qualityScore, qualityNotes: result.qualityNotes },
      completed_at: new Date().toISOString(),
    }).eq('id', generationId)

    if (userId) await supabase.rpc('increment_generation_count', { uid: userId }).catch(() => {})

    return NextResponse.json({ success: true, outputUrl, qualityScore: result.qualityScore })
  } catch (e: any) {
    if (generationId) {
      await supabase.from('generations').update({
        status: 'failed', progress: 0,
        output_metadata: { error: e.message },
      }).eq('id', generationId).catch(() => {})
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

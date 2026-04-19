// app/api/rate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { inngest } from '@/lib/inngest'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { generationId, rating } = await req.json()
  if (!generationId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const admin = createAdminClient()

  await admin.from('generation_ratings').insert({
    generation_id: generationId,
    user_id: user.id,
    rating,
  })

  const { data: gen } = await admin
    .from('generations')
    .select('system_type, prompt, output_metadata')
    .eq('id', generationId)
    .single()

  if (gen?.system_type === 'builder') {
    const { detectBuildingType } = await import('@/lib/room-templates')
    const buildingType = detectBuildingType(gen.prompt || '')
    const meta = gen.output_metadata || {}

    if (rating >= 4) {
      try {
        await admin.from('ai_knowledge').insert({
          content: `GOLDEN: ${buildingType} floorCount=${meta.floorCount||'?'} style=${meta.architecturalStyle||'?'} ec=${meta.exteriorColor||'?'} score=${meta.qualityScore||'?'} rated ${rating}/5`,
          system_type: 'builder',
          category: buildingType,
          is_active: true,
        })
      } catch { /* non-fatal */ }
    }

    if (rating <= 2 && buildingType) {
      try {
        await admin.from('knowledge_patches').insert({
          building_type: buildingType,
          patch_note: `LOW_RATING:${rating} score:${meta.qualityScore||'?'}`,
        })
      } catch { /* non-fatal */ }

      const { count } = await admin
        .from('knowledge_patches')
        .select('*', { count: 'exact', head: true })
        .eq('building_type', buildingType)

      if ((count || 0) >= 3) {
        await inngest.send({ name: 'research/retry', data: { buildingType } }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ success: true })
}

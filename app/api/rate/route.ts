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

  if (rating <= 2) {
    const { data: gen } = await admin
      .from('generations')
      .select('system_type, prompt')
      .eq('id', generationId)
      .single()

    if (gen?.system_type === 'builder' && gen.prompt) {
      const { detectBuildingType } = await import('@/lib/room-templates')
      const buildingType = detectBuildingType(gen.prompt)
      if (buildingType) {
        await inngest.send({ name: 'research/retry', data: { buildingType } }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ success: true })
}

// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { inngest } from '@/lib/inngest'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_authorized')
      .eq('id', user.id)
      .single()

    if (!profile?.is_authorized) {
      return NextResponse.json(
        { error: 'Not authorized. Contact the owner to get access.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { prompt, systemType, style, scale, locationReference, variations, referenceImages } = body

    if (!prompt || !systemType) {
      return NextResponse.json({ error: 'Missing prompt or systemType' }, { status: 400 })
    }

    // Create generation record
    const { data: generation, error } = await admin
      .from('generations')
      .insert({
        user_id: user.id,
        system_type: systemType,
        prompt,
        status: 'queued',
        progress: 0,
      })
      .select()
      .single()

    if (error) throw error

    // Trigger Inngest job — pass all options through
    await inngest.send({
      name: 'turbobuilder/generate',
      data: {
        generationId: generation.id,
        prompt,
        systemType,
        userId: user.id,
        options: {
          style: style || undefined,
          scale: scale || 'medium',
          locationReference: locationReference || undefined,
          variations: variations || 1,
          referenceImages: referenceImages || undefined,
        },
      },
    })

    return NextResponse.json({ generationId: generation.id })
  } catch (err: any) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

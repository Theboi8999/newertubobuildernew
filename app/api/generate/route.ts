import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { inngest } from '@/lib/inngest'
 
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(cookies())
    const { data: { user } } = await supabase.auth.getUser()
 
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    // Check if user is authorized
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_authorized')
      .eq('id', user.id)
      .single()
 
    if (!profile?.is_authorized) {
      return NextResponse.json({ error: 'Not authorized. Contact the owner to get access.' }, { status: 403 })
    }
 
    const { prompt, systemType } = await req.json()
 
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
 
    // Trigger Inngest job
    await inngest.send({
      name: 'turbobuilder/generate',
      data: {
        generationId: generation.id,
        prompt,
        systemType,
        userId: user.id,
      },
    })
 
    return NextResponse.json({ generationId: generation.id })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
 

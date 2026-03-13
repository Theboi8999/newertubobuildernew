import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { parseSceneDescription } from '@/lib/scene-builder'

export async function POST(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  const plan = await parseSceneDescription(prompt)
  return NextResponse.json({ plan })
}

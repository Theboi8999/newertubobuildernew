// app/api/admin/research/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { researchBuildingType } from '@/lib/research-agent'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { buildingType } = await req.json()
  if (!buildingType?.trim()) return NextResponse.json({ error: 'buildingType required' }, { status: 400 })

  const result = await researchBuildingType(buildingType.trim(), true)
  return NextResponse.json({ success: true, result })
}

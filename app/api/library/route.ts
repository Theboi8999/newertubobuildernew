import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
 
export async function GET(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
 
  let query = supabase.from('script_library').select('*', { count: 'exact' })
    .order('usage_count', { ascending: false })
    .range((page-1)*limit, page*limit-1)
 
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
 
  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scripts: data, total: count, page, limit })
}
 
export async function PUT(req: NextRequest) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 
  const { id, name, description, luau_code, keywords, quality_score } = await req.json()
  const { error } = await supabase.from('script_library')
    .update({ name, description, luau_code, keywords, quality_score }).eq('id', id)
 
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

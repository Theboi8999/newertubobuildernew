import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('generations')
    .select('id, user_id, system_type, prompt, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return NextResponse.json({ generations: data ?? [] })
}

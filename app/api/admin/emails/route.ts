import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('authorized_emails')
    .select('*')
    .order('added_at', { ascending: false })
  return NextResponse.json({ emails: data ?? [] })
}

export async function POST(req: Request) {
  const { email } = await req.json()
  const { data, error } = await supabase
    .from('authorized_emails')
    .insert({ email: email.toLowerCase(), added_by: 'owner' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ email: data })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await supabase.from('authorized_emails').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

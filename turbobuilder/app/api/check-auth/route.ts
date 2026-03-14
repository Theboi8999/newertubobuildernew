import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ authorized: false })

  // Owner is always authorized
  if (email === process.env.OWNER_EMAIL) {
    return NextResponse.json({ authorized: true, role: 'owner' })
  }

  // Check authorized_emails table
  const { data } = await supabase
    .from('authorized_emails')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  return NextResponse.json({ authorized: !!data })
}

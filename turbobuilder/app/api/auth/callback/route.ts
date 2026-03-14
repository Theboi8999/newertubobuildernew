import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      const { createAdminClient } = await import('@/lib/supabase')
      const admin = createAdminClient()
      const isOwner = user.email === process.env.OWNER_EMAIL

      await admin.from('profiles').upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_authorized: isOwner,
        is_admin: isOwner,
      }, { onConflict: 'id' })

      const { data: authEmail } = await admin
        .from('authorized_emails')
        .select('email')
        .eq('email', user.email!)
        .single()

      if (authEmail) {
        await admin.from('profiles').update({ is_authorized: true }).eq('id', user.id)
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', req.url))
}

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session_id = request.nextUrl.searchParams.get('session_id')
  if (!session_id) return Response.json({ part: null })

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('agent_parts')
      .select('*')
      .eq('session_id', session_id)
      .eq('processed', false)
      .order('id', { ascending: true })
      .limit(1)

    if (error || !data || data.length === 0) {
      return Response.json({ part: null })
    }

    const row = data[0]

    // Mark this row processed
    await supabase
      .from('agent_parts')
      .update({ processed: true })
      .eq('id', row.id)

    // If it's a __clear sentinel, wipe only rows queued *before* this clear (not rows added after)
    if (row.part_json && row.part_json.__clear) {
      await supabase
        .from('agent_parts')
        .update({ processed: true })
        .eq('session_id', session_id)
        .eq('processed', false)
        .lt('id', row.id)
    }

    return Response.json({ part: row.part_json })
  } catch (e: any) {
    console.error('[agent-parts GET]', e)
    return Response.json({ part: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { part, session_id } = await request.json()
    if (!part || !session_id) {
      return Response.json({ error: 'Missing part or session_id' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('agent_parts')
      .insert({ session_id, part_json: part, processed: false })

    if (error) {
      console.error('[agent-parts POST] insert error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e: any) {
    console.error('[agent-parts POST]', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: flush all unprocessed parts for a session (call before starting a build)
export async function DELETE(request: NextRequest) {
  const session_id = request.nextUrl.searchParams.get('session_id')
  if (!session_id) return Response.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const supabase = createAdminClient()
    await supabase
      .from('agent_parts')
      .update({ processed: true })
      .eq('session_id', session_id)
      .eq('processed', false)

    return Response.json({ flushed: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

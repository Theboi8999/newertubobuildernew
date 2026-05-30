import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('generations')
      .select('lua_script, output_metadata, prompt, part_count')
      .eq('status', 'complete')
      .not('lua_script', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'No Lua generation found' }, { status: 404 })
    }

    const buildingType = (data.output_metadata as any)?.buildingType ?? 'unknown'

    return NextResponse.json({
      script: data.lua_script,
      buildingType,
      partsCount: data.part_count ?? 0,
      prompt: data.prompt,
    })
  } catch (e: any) {
    console.error('[latest-lua-job]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Try to serve the latest saved lua_script from the DB
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('generations')
      .select('lua_script, output_metadata, prompt, part_count')
      .eq('status', 'complete')
      .not('lua_script', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data?.lua_script) {
      const buildingType = (data.output_metadata as any)?.buildingType ?? 'ottoman_house'
      return NextResponse.json({
        script: data.lua_script,
        buildingType,
        partsCount: data.part_count ?? 0,
        prompt: data.prompt ?? '',
      })
    }

    if (error) {
      console.warn('[latest-lua-job] DB query failed (column may not exist yet):', error.message)
    }
  } catch (e: any) {
    console.error('[latest-lua-job] DB error:', e)
  }

  // Fallback: generate the ottoman house script on the fly
  // This works before the lua_script column migration has been applied,
  // and before any new generations have been run.
  try {
    const { buildOttomanHouse } = await import('@/lib/modes/ottoman-house')
    const { generateLuaScript } = await import('@/lib/lua-generator')
    const parts = buildOttomanHouse(0)
    const fakeResearch = { buildingType: 'ottoman_house' } as any
    const script = generateLuaScript(fakeResearch, parts)
    return NextResponse.json({
      script,
      buildingType: 'ottoman_house',
      partsCount: parts.length,
      prompt: 'ottoman house',
    })
  } catch (e: any) {
    console.error('[latest-lua-job] fallback generation failed:', e)
    return NextResponse.json({ error: 'No lua script available' }, { status: 503 })
  }
}

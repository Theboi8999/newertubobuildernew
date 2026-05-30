import { createAdminClient } from '@/lib/supabase'
import { generateLuaScript } from '@/lib/lua-generator'
import { buildOttomanHouse } from '@/lib/modes/ottoman-house'

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
      return Response.json({
        script: data.lua_script,
        buildingType,
        partsCount: data.part_count ?? 0,
        prompt: data.prompt ?? '',
      })
    }

    if (error) {
      console.warn('[latest-lua-job] DB query error (lua_script column may not exist yet):', error.message)
    }
  } catch (e: any) {
    console.error('[latest-lua-job] DB error:', e)
  }

  // Fallback: generate ottoman house script directly so the endpoint always returns 200
  const parts = buildOttomanHouse(0)
  const script = generateLuaScript({ buildingType: 'ottoman_house' } as any, parts)
  return Response.json({
    script,
    buildingType: 'ottoman_house',
    partsCount: parts.length,
    prompt: 'ottoman house',
  })
}

// lib/self-teaching-agent.ts
import { createAdminClient } from './supabase'
import { inngest } from './inngest'

export async function teachFromGeneration(params: {
  buildingType: string
  qualityScore: number
  partCount: number
  roomNames: string[]
  generationId: string
}): Promise<void> {
  const { buildingType, qualityScore, partCount, roomNames, generationId } = params
  const supabaseAdmin = createAdminClient()

  const issues: string[] = []
  if (partCount < 30) issues.push('too few parts — increase furniture density')
  if (roomNames.length < 5) issues.push('too few rooms — research agent needs better room extraction')
  if (qualityScore < 60) issues.push('low quality score — generation failed significantly')

  const patchNote = qualityScore >= 80
    ? `SUCCESS: ${partCount} parts, rooms: ${roomNames.join(', ')}`
    : `FAILURE: score ${qualityScore}, issues: ${issues.join('; ')}`

  try {
    await supabaseAdmin.from('knowledge_patches').insert({
      building_type: buildingType,
      patch_note: patchNote,
    })
  } catch (e) {
    console.error('[self-teaching] patch insert error:', e)
    return
  }

  // Check failure streak — trigger re-research only after 10 consecutive failures AND current gen also failed
  try {
    const { data: failures } = await supabaseAdmin
      .from('knowledge_patches')
      .select('*')
      .eq('building_type', buildingType)
      .ilike('patch_note', 'FAILURE%')
      .order('applied_at', { ascending: false })
      .limit(10)

    if (failures && failures.length >= 10 && qualityScore < 50) {
      await inngest.send({ name: 'research/retry', data: { buildingType, forceRefresh: true } })
      console.log(`[self-teaching] triggered re-research for "${buildingType}" after ${failures.length} failures`)
    }
  } catch (e) {
    console.error('[self-teaching] failure count check error:', e)
  }

  // Save golden example if score is excellent
  if (qualityScore >= 90) {
    try {
      await supabaseAdmin.from('ai_knowledge').upsert({
        system_type: 'builder',
        category: buildingType,
        content: `Golden example for ${buildingType}: ${partCount} parts, rooms: ${roomNames.join(', ')}. Quality score: ${qualityScore}.`,
        is_active: true,
      }, { onConflict: 'system_type,category' })
      console.log(`[self-teaching] saved golden example for "${buildingType}" (score ${qualityScore})`)
    } catch (e) {
      console.error('[self-teaching] golden example save error:', e)
    }
  }
}

export async function getTeachingContext(buildingType: string): Promise<string> {
  const supabaseAdmin = createAdminClient()

  try {
    const { data: patches } = await supabaseAdmin
      .from('knowledge_patches')
      .select('patch_note, applied_at')
      .eq('building_type', buildingType)
      .order('applied_at', { ascending: false })
      .limit(5)

    if (!patches || patches.length === 0) return ''

    const successes = patches.filter((p: any) => p.patch_note.startsWith('SUCCESS'))
    const failures = patches.filter((p: any) => p.patch_note.startsWith('FAILURE'))

    return [
      successes.length > 0 ? `Previous successes: ${successes.map((p: any) => p.patch_note).join(' | ')}` : '',
      failures.length > 0 ? `Known issues to avoid: ${failures.map((p: any) => p.patch_note).join(' | ')}` : '',
    ].filter(Boolean).join('\n')
  } catch {
    return ''
  }
}

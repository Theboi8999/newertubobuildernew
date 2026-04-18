// lib/auto-evaluator.ts
import { createAdminClient } from './supabase'
import { inngest } from './inngest'
import { ResearchResult } from './research-agent'

export interface EvaluationResult {
  score: number
  notes: string
  missingRooms: string[]
  passed: boolean
}

export async function evaluateGeneration(params: {
  rbxmx: string
  buildingType: string
  researchResult: ResearchResult
  generationId: string
}): Promise<EvaluationResult> {
  const { rbxmx, buildingType, researchResult, generationId } = params
  const supabase = createAdminClient()

  const partCount = (rbxmx.match(/<Item class="Part"/g) || []).length
  const expectedRooms = researchResult.rooms.map(r => r.name)
  const missingRooms: string[] = []

  for (const roomName of expectedRooms) {
    const pattern = roomName.toLowerCase().replace(/\s+/g, '_')
    if (!rbxmx.toLowerCase().includes(pattern) && !rbxmx.toLowerCase().includes(roomName.toLowerCase())) {
      missingRooms.push(roomName)
    }
  }

  let score = 100
  score -= missingRooms.length * 5
  if (partCount < 20) score -= 10
  if (partCount < 10) score -= 15
  if (partCount > 50) score += 5
  score = Math.max(0, Math.min(100, score))

  const notesParts: string[] = [`${partCount} parts`]
  if (missingRooms.length > 0) notesParts.push(`Missing: ${missingRooms.join(', ')}`)
  const notes = notesParts.join(' | ')
  const passed = score >= 70

  if (!passed) {
    try {
      await supabase.from('generation_failures').insert({
        building_type: buildingType,
        failure_reason: notes,
        missing_rooms: missingRooms,
        quality_score: score,
        generation_id: generationId,
      })

      // Check if this building type has 3+ failures — if so, trigger re-research
      const { count } = await supabase
        .from('generation_failures')
        .select('*', { count: 'exact', head: true })
        .eq('building_type', buildingType)

      if ((count || 0) >= 3) {
        await inngest.send({ name: 'research/retry', data: { buildingType } })
      }
    } catch (e) {
      console.error('[evaluateGeneration] DB log error:', e)
    }
  }

  return { score, notes, missingRooms, passed }
}

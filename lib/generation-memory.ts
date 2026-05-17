import { createAdminClient } from './supabase'

export interface GenerationMemoryRecord {
  buildingType: string
  architecturalStyle: string
  exteriorColor: string
  roofType: string
  floorCount: number
  partCount: number
  roomCount: number
  climate: string
  goldenSpecId: string | null
  qualityScore: number
  generationId: string
  createdAt?: string
}

export interface MemorySummary {
  avgPartCount: number
  avgQuality: number
  topGoldenSpecId: string | null
  sampleCount: number
}

export async function saveGenerationMemory(record: GenerationMemoryRecord): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('generation_memory').insert({
      building_type: record.buildingType,
      architectural_style: record.architecturalStyle,
      exterior_color: record.exteriorColor,
      roof_type: record.roofType,
      floor_count: record.floorCount,
      part_count: record.partCount,
      room_count: record.roomCount,
      climate: record.climate,
      golden_spec_id: record.goldenSpecId,
      quality_score: record.qualityScore,
      generation_id: record.generationId,
    })
  } catch (e) {
    console.error('[generation-memory] save error:', e)
  }
}

export async function getMemorySummary(buildingType: string): Promise<MemorySummary | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('generation_memory')
      .select('part_count, quality_score, golden_spec_id')
      .eq('building_type', buildingType)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error || !data || data.length === 0) return null

    const avgPartCount = Math.round(data.reduce((s: number, r: any) => s + (r.part_count || 0), 0) / data.length)
    const avgQuality = Math.round(data.reduce((s: number, r: any) => s + (r.quality_score || 0), 0) / data.length)

    const specCounts: Record<string, number> = {}
    for (const row of data) {
      if (row.golden_spec_id) {
        specCounts[row.golden_spec_id] = (specCounts[row.golden_spec_id] || 0) + 1
      }
    }
    const topGoldenSpecId = Object.keys(specCounts).length > 0
      ? Object.entries(specCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null

    return { avgPartCount, avgQuality, topGoldenSpecId, sampleCount: data.length }
  } catch (e) {
    console.error('[generation-memory] summary error:', e)
    return null
  }
}

export async function getBestConfigForType(buildingType: string): Promise<Partial<GenerationMemoryRecord> | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('generation_memory')
      .select('*')
      .eq('building_type', buildingType)
      .gte('quality_score', 80)
      .order('quality_score', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) return null
    const row = data[0]
    return {
      architecturalStyle: row.architectural_style,
      exteriorColor: row.exterior_color,
      roofType: row.roof_type,
      floorCount: row.floor_count,
      goldenSpecId: row.golden_spec_id,
    }
  } catch (e) {
    console.error('[generation-memory] best config error:', e)
    return null
  }
}

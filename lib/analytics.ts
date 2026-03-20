import { createClient } from '@/lib/supabase'

export interface AnalyticsSummary {
  totalGenerations: number
  avgQualityScore: number
  qualityTrend: { date: string; avg_score: number }[]
  topPrompts: { prompt: string; count: number; avg_score: number }[]
  failedGenerations: { prompt: string; score: number; system_type: string; created_at: string }[]
  systemBreakdown: { system_type: string; count: number; avg_score: number }[]
  dailyGenerations: { date: string; count: number }[]
  scriptLibrarySize: number
  newScriptsThisWeek: number
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const supabase = createClient()

  try {
    // Total + avg quality
    const { data: totals } = await supabase
      .from('generations')
      .select('id, output_metadata, system_type, prompt, created_at, status')
      .eq('status', 'complete')

    const gens = totals || []
    const totalGenerations = gens.length
    const scores = gens
      .map(g => g.output_metadata?.qualityScore)
      .filter(Boolean) as number[]
    const avgQualityScore = scores.length > 0
      ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length)
      : 0

    // Quality trend (last 14 days)
    const qualityTrend: { date: string; avg_score: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayGens = gens.filter(g => g.created_at?.startsWith(dateStr))
      const dayScores = dayGens.map(g => g.output_metadata?.qualityScore).filter(Boolean) as number[]
      qualityTrend.push({
        date: dateStr,
        avg_score: dayScores.length > 0
          ? Math.round(dayScores.reduce((a,b) => a+b, 0) / dayScores.length)
          : 0
      })
    }

    // Daily generation counts
    const dailyGenerations: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyGenerations.push({
        date: dateStr,
        count: gens.filter(g => g.created_at?.startsWith(dateStr)).length
      })
    }

    // System breakdown
    const systemMap: Record<string, { count: number; scores: number[] }> = {}
    for (const g of gens) {
      const s = g.system_type || 'unknown'
      if (!systemMap[s]) systemMap[s] = { count: 0, scores: [] }
      systemMap[s].count++
      if (g.output_metadata?.qualityScore) systemMap[s].scores.push(g.output_metadata.qualityScore)
    }
    const systemBreakdown = Object.entries(systemMap).map(([system_type, data]) => ({
      system_type,
      count: data.count,
      avg_score: data.scores.length > 0
        ? Math.round(data.scores.reduce((a,b) => a+b, 0) / data.scores.length)
        : 0
    }))

    // Failed generations (score < 60)
    const failedGenerations = gens
      .filter(g => g.output_metadata?.qualityScore && g.output_metadata.qualityScore < 60)
      .slice(0, 10)
      .map(g => ({
        prompt: g.prompt,
        score: g.output_metadata.qualityScore,
        system_type: g.system_type,
        created_at: g.created_at,
      }))

    // Top prompts (most repeated)
    const promptMap: Record<string, { count: number; scores: number[] }> = {}
    for (const g of gens) {
      const key = g.prompt?.slice(0, 60) || ''
      if (!promptMap[key]) promptMap[key] = { count: 0, scores: [] }
      promptMap[key].count++
      if (g.output_metadata?.qualityScore) promptMap[key].scores.push(g.output_metadata.qualityScore)
    }
    const topPrompts = Object.entries(promptMap)
      .sort((a,b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([prompt, data]) => ({
        prompt,
        count: data.count,
        avg_score: data.scores.length > 0
          ? Math.round(data.scores.reduce((a,b) => a+b, 0) / data.scores.length)
          : 0,
      }))

    // Script library stats
    const { count: scriptLibrarySize } = await supabase
      .from('script_library')
      .select('id', { count: 'exact', head: true })

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: newScriptsThisWeek } = await supabase
      .from('script_library')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    return {
      totalGenerations,
      avgQualityScore,
      qualityTrend,
      topPrompts,
      failedGenerations,
      systemBreakdown,
      dailyGenerations,
      scriptLibrarySize: scriptLibrarySize || 0,
      newScriptsThisWeek: newScriptsThisWeek || 0,
    }
  } catch (e) {
    console.error('Analytics error:', e)
    return {
      totalGenerations: 0,
      avgQualityScore: 0,
      qualityTrend: [],
      topPrompts: [],
      failedGenerations: [],
      systemBreakdown: [],
      dailyGenerations: [],
      scriptLibrarySize: 0,
      newScriptsThisWeek: 0,
    }
  }
}

// Log a failed generation for review
export async function logFailedGeneration(
  prompt: string,
  systemType: string,
  qualityScore: number,
  notes: string,
  userId: string
): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('failed_generations').insert({
      prompt,
      system_type: systemType,
      quality_score: qualityScore,
      notes,
      user_id: userId,
      reviewed: false,
    })
  } catch {}
}

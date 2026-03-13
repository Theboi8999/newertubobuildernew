import { createClient } from '@/lib/supabase'

export interface PromptHistoryEntry {
  prompt: string
  system_type: string
  quality_score: number
  style?: string
  scale?: string
  rating?: number
  created_at: string
}

export interface UserPreferences {
  preferred_style?: string
  preferred_scale?: string
  top_keywords: string[]
  avg_quality: number
  total_generations: number
}

// Save prompt to history after generation
export async function savePromptHistory(
  userId: string,
  entry: Omit<PromptHistoryEntry, 'created_at'>
): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('prompt_history').insert({
      user_id: userId,
      ...entry,
    })
  } catch {}
}

// Get last 5 prompts for a user (shown as suggestions)
export async function getRecentPrompts(userId: string, systemType: string): Promise<PromptHistoryEntry[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('user_id', userId)
      .eq('system_type', systemType)
      .order('created_at', { ascending: false })
      .limit(5)
    return (data || []) as PromptHistoryEntry[]
  } catch {
    return []
  }
}

// Learn user preferences from their history
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!data || data.length === 0) return null

    // Find most used style
    const styleCounts: Record<string, number> = {}
    const scaleCounts: Record<string, number> = {}
    const keywords: string[] = []
    let totalQuality = 0
    let qualityCount = 0

    for (const entry of data) {
      if (entry.style) styleCounts[entry.style] = (styleCounts[entry.style] || 0) + 1
      if (entry.scale) scaleCounts[entry.scale] = (scaleCounts[entry.scale] || 0) + 1
      if (entry.quality_score) { totalQuality += entry.quality_score; qualityCount++ }
      // Extract keywords from prompts
      const words = entry.prompt.toLowerCase().split(' ')
      for (const w of words) {
        if (w.length > 4 && !['with','that','have','this','make','from','into'].includes(w)) {
          keywords.push(w)
        }
      }
    }

    const preferred_style = Object.entries(styleCounts).sort((a,b) => b[1]-a[1])[0]?.[0]
    const preferred_scale = Object.entries(scaleCounts).sort((a,b) => b[1]-a[1])[0]?.[0]

    // Top 5 most common keywords
    const kwCount: Record<string, number> = {}
    for (const kw of keywords) kwCount[kw] = (kwCount[kw] || 0) + 1
    const top_keywords = Object.entries(kwCount)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 5)
      .map(([kw]) => kw)

    return {
      preferred_style,
      preferred_scale,
      top_keywords,
      avg_quality: qualityCount > 0 ? Math.round(totalQuality / qualityCount) : 0,
      total_generations: data.length,
    }
  } catch {
    return null
  }
}

// Rate a generation (1-5 stars)
export async function rateGeneration(generationId: string, rating: number): Promise<void> {
  try {
    const supabase = createClient()
    await supabase
      .from('generations')
      .update({ rating })
      .eq('id', generationId)
  } catch {}
}

// Get prompt improvement suggestions based on history
export async function getPromptSuggestions(
  userId: string,
  currentPrompt: string,
  systemType: string
): Promise<string[]> {
  try {
    const recent = await getRecentPrompts(userId, systemType)
    if (recent.length === 0) return []

    // Find high-quality previous prompts similar to current
    const highQuality = recent.filter(r => r.quality_score >= 80)
    if (highQuality.length === 0) return []

    return highQuality.slice(0, 3).map(r =>
      r.prompt !== currentPrompt ? r.prompt : ''
    ).filter(Boolean)
  } catch {
    return []
  }
}

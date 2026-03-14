import { createClient } from '@/lib/supabase'

export interface RateLimitResult {
  allowed: boolean
  reason?: string
  suggestion?: string
  waitSeconds?: number
}

const RATE_LIMITS = {
  // per user per hour
  default: 20,
  lowQuality: 5,   // if avg quality is below 65
}

const LOW_QUALITY_THRESHOLD = 65
const LOW_QUALITY_LOOKBACK = 5  // last N generations

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  try {
    const supabase = createClient()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Count generations in last hour
    const { count } = await supabase
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)

    const recentCount = count || 0

    // Check last N generation quality scores
    const { data: recent } = await supabase
      .from('generations')
      .select('output_metadata')
      .eq('user_id', userId)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(LOW_QUALITY_LOOKBACK)

    const recentScores = (recent || [])
      .map(g => g.output_metadata?.qualityScore)
      .filter(Boolean) as number[]

    const avgRecentQuality = recentScores.length > 0
      ? recentScores.reduce((a,b) => a+b, 0) / recentScores.length
      : 100

    // Apply lower limit if quality is consistently low
    const limit = avgRecentQuality < LOW_QUALITY_THRESHOLD
      ? RATE_LIMITS.lowQuality
      : RATE_LIMITS.default

    if (recentCount >= limit) {
      const oldestInWindow = new Date(Date.now() - 60 * 60 * 1000)
      const waitSeconds = Math.ceil((oldestInWindow.getTime() + 60 * 60 * 1000 - Date.now()) / 1000)

      if (avgRecentQuality < LOW_QUALITY_THRESHOLD) {
        return {
          allowed: false,
          reason: `Your recent generations have averaged ${Math.round(avgRecentQuality)}/100 quality. To get better results and unlock more generations, try being more specific in your prompts.`,
          suggestion: 'Instead of "police car", try "NSW Police Chrysler 300 sedan with checkerboard livery, ELS light bar, and full interior"',
          waitSeconds,
        }
      }

      return {
        allowed: false,
        reason: `Generation limit reached (${limit} per hour). Please wait before generating more.`,
        waitSeconds,
      }
    }

    return { allowed: true }
  } catch {
    return { allowed: true }  // fail open
  }
}

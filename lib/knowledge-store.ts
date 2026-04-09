// Fetches relevant knowledge from Supabase ai_knowledge table
import { createAdminClient } from './supabase'

export async function getKnowledgeForPrompt(prompt: string): Promise<string> {
  try {
    const supabase = createAdminClient()
    const words = prompt.toLowerCase().split(' ').filter(w => w.length > 3)

    // Search for matching knowledge entries
    const { data } = await supabase
      .from('ai_knowledge')
      .select('topic, content, quality_score')
      .order('quality_score', { ascending: false })
      .limit(20)

    if (!data || data.length === 0) return ''

    // Filter entries that match the prompt
    const relevant = data.filter(entry => {
      const entryText = (entry.topic + ' ' + entry.content).toLowerCase()
      return words.some(word => entryText.includes(word))
    }).slice(0, 5)

    if (relevant.length === 0) return ''

    // Increment usage count
    await supabase.rpc('increment_knowledge_usage', { topics: relevant.map(r => r.topic) }).catch(() => {})

    return relevant.map(r => r.content).join('\n\n')
  } catch {
    return ''
  }
}

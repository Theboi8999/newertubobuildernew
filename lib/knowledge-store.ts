import { createAdminClient } from './supabase'

export async function getKnowledgeForPrompt(prompt: string): Promise<string> {
  try {
    const supabase = createAdminClient()
    const words = prompt.toLowerCase().split(' ').filter(w => w.length > 3)

    const { data } = await supabase
      .from('ai_knowledge')
      .select('topic, content, quality_score')
      .order('quality_score', { ascending: false })
      .limit(20)

    if (!data || data.length === 0) return ''

    const relevant = data.filter(entry => {
      const entryText = (entry.topic + ' ' + entry.content).toLowerCase()
      return words.some(word => entryText.includes(word))
    }).slice(0, 5)

    if (relevant.length === 0) return ''

    return relevant.map(r => r.content).join('\n\n')
  } catch {
    return ''
  }
}

import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'turbobuilder',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

export const generateFunction = inngest.createFunction(
  { id: 'generate-asset', name: 'Generate Roblox Asset', timeout: '10m' },
  { event: 'turbobuilder/generate' },
  async ({ event, step }) => {
    const { generationId, prompt, systemType } = event.data

    const { createAdminClient } = await import('./supabase')
    const { generateAsset } = await import('./generator')
    const supabase = createAdminClient()

    // Update status: researching
    await step.run('update-researching', async () => {
      await supabase.from('generations').update({
        status: 'researching',
        progress: 10,
      }).eq('id', generationId)
    })

    // Update status: generating
    await step.run('update-generating', async () => {
      await supabase.from('generations').update({
        status: 'generating',
        progress: 40,
      }).eq('id', generationId)
    })

    // Run generation
    const result = await step.run('generate', async () => {
      return generateAsset(prompt, systemType)
    })

    // Update status: complete
    await step.run('update-complete', async () => {
      // Upload rbxmx to Supabase storage
      const fileName = `${generationId}.rbxmx`
      const { data: uploadData } = await supabase.storage
        .from('generations')
        .upload(fileName, result.rbxmx, { contentType: 'text/xml' })

      const { data: urlData } = supabase.storage
        .from('generations')
        .getPublicUrl(fileName)

      await supabase.from('generations').update({
        status: 'complete',
        progress: 100,
        spec_items: result.spec,
        output_url: urlData.publicUrl,
        output_metadata: {
          qualityScore: result.qualityScore,
          qualityNotes: result.qualityNotes,
        },
        completed_at: new Date().toISOString(),
      }).eq('id', generationId)

      // Increment user's generation count
      const { data: gen } = await supabase.from('generations').select('user_id').eq('id', generationId).single()
      if (gen) {
        await supabase.rpc('increment_generation_count', { user_id: gen.user_id })
      }
    })

    return { success: true, generationId }
  }
)

// lib/inngest.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'turbobuilder',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

export const researchRetryFunction = inngest.createFunction(
  { id: 'research-retry', name: 'Re-research Building Type', retries: 1 },
  { event: 'research/retry' },
  async ({ event, step }) => {
    const { buildingType } = event.data as { buildingType: string }

    await step.run('re-research', async () => {
      const { researchBuildingType } = await import('./research-agent')
      const result = await researchBuildingType(buildingType, { forceRefresh: true })
      console.log(`[researchRetry] Re-researched "${buildingType}" — confidence: ${result.confidence}`)
      return result
    })

    return { success: true, buildingType }
  }
)

export const generateFunction = inngest.createFunction(
  {
    id: 'generate-asset',
    name: 'Generate Roblox Asset',
    timeouts: { finish: '10m' },
    retries: 1,
  },
  { event: 'turbobuilder/generate' },
  async ({ event, step }) => {
    const { generationId, prompt, systemType, userId, options } = event.data

    const { createAdminClient } = await import('./supabase')
    const supabase = createAdminClient()

    // Step 1: Mark as researching
    await step.run('update-researching', async () => {
      await supabase
        .from('generations')
        .update({ status: 'researching', progress: 10 })
        .eq('id', generationId)
    })

    // Step 2: Mark as generating
    await step.run('update-generating', async () => {
      await supabase
        .from('generations')
        .update({ status: 'generating', progress: 35 })
        .eq('id', generationId)
    })

    // Step 3: Run the actual generation — with full error handling
    let result: any = null
    let generationError: string | null = null

    try {
      result = await step.run('generate', async () => {
        const { generateAsset } = await import('./generator')
        return generateAsset(
          prompt,
          systemType,
          options || {},
          userId,
          generationId,
          async (msg: string, percent: number) => {
            // Fire-and-forget progress updates (don't await — keeps generation moving)
            ;(async () => { try { await supabase.from('generations').update({ status: 'generating', progress: percent }).eq('id', generationId) } catch {} })()
          }
        )
      })
    } catch (err: any) {
      generationError = err?.message || 'Unknown generation error'
    }

    // Step 4: Save result or record failure
    await step.run('update-complete', async () => {
      if (generationError || !result) {
        try {
          await supabase
            .from('generations')
            .update({ status: 'failed', progress: 0 })
            .eq('id', generationId)
        } catch (e) {
          console.error('[inngest] failed to mark failed:', e)
        }
        return { success: false, error: generationError }
      }

      // Upload .rbxmx to Supabase Storage
      const fileName = `${generationId}.rbxmx`
      let fileUrl: string | null = null

      try {
        const { error: uploadError } = await supabase.storage
          .from('generations')
          .upload(fileName, Buffer.from(result.rbxmx), {
            contentType: 'application/xml',
            upsert: true,
          })

        if (uploadError) {
          console.error('[inngest] upload error:', uploadError.message)
        } else {
          const { data: urlData } = supabase.storage.from('generations').getPublicUrl(fileName)
          fileUrl = urlData.publicUrl
          console.log('[inngest] upload success:', fileName)
        }
      } catch (e) {
        console.error('[inngest] upload threw:', e)
      }

      try {
        const { error: updateError } = await supabase
          .from('generations')
          .update({
            status: 'complete',
            progress: 100,
            file_url: fileUrl,
            quality_score: result.qualityScore ?? 0,
            completed_at: new Date().toISOString(),
          })
          .eq('id', generationId)
        if (updateError) {
          console.error('[inngest] failed to update status to complete:', updateError.message)
        } else {
          console.log('[inngest] status updated to complete:', generationId)
        }
      } catch (e) {
        console.error('[inngest] failed to update status to complete:', e)
      }

      // Increment user generation count (non-fatal if it fails)
      try {
        await supabase.rpc('increment_generation_count', { uid: userId })
      } catch { /* ignore */ }

      return { success: true, generationId }
    })

    return { success: !generationError, generationId }
  }
)

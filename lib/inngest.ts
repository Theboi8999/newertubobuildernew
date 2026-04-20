// lib/inngest.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'turbobuilder',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

export const researchRetryFunction = inngest.createFunction(
  { id: 'research-retry', name: 'Re-research Building Type', retries: 1 },
  { event: 'research/retry' },
  async ({ event }) => {
    console.log('[research-retry] disabled to prevent loops')
    return { disabled: true }
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
        .update({ status: 'generating', progress: 30 })
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

    console.log('[inngest] generation returned, rbxmx length:', result?.rbxmx?.length, 'parts:', result?.partCount)

    // Step 4: Save result or record failure
    await step.run('update-complete', async () => {
      try {
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

        // Upload .rbxmx to Supabase Storage (non-fatal)
        const fileName = `${generationId}.rbxmx`
        let fileUrl = ''

        console.log('[inngest] rbxmx size:', result.rbxmx.length, 'bytes, parts:', result.partCount)

        try {
          const { error: uploadError } = await supabase.storage
            .from('generations')
            .upload(fileName, Buffer.from(result.rbxmx, 'utf-8'), {
              contentType: 'application/xml',
              upsert: true,
            })

          if (uploadError) {
            console.error('[inngest] storage upload failed:', uploadError.message)
          } else {
            const { data: urlData } = supabase.storage.from('generations').getPublicUrl(fileName)
            fileUrl = urlData.publicUrl
            console.log('[inngest] uploaded successfully, url:', fileUrl)
          }
        } catch (uploadErr) {
          console.error('[inngest] upload crashed:', uploadErr)
        }

        // Update 1: mark complete with core fields
        console.log('[inngest] updating to complete, parts:', result.partCount)
        const { error: completeError } = await supabase
          .from('generations')
          .update({
            status: 'complete',
            progress: 100,
            completed_at: new Date().toISOString(),
            part_count: result.partCount || 0,
          })
          .eq('id', generationId)

        if (completeError) {
          console.error('[inngest] completion update failed:', completeError.message, completeError.code)
        } else {
          console.log('[inngest] ✅ marked complete')
        }

        // Update 2: save output fields (non-fatal if this fails)
        try {
          await supabase
            .from('generations')
            .update({
              output_url: fileUrl,
              spec_items: result.spec || [],
              output_metadata: {
                qualityScore: result.qualityScore,
                qualityNotes: result.qualityNotes,
                roomLayout: result.roomLayout || [],
              },
            })
            .eq('id', generationId)
        } catch (e) {
          console.error('[inngest] output fields update failed:', e)
        }

        // Increment user generation count (non-fatal)
        try {
          await supabase.rpc('increment_generation_count', { uid: userId })
        } catch { /* ignore */ }

        return { success: true, generationId }
      } catch (fatalError) {
        console.error('[inngest] FATAL ERROR in update-complete step:', fatalError)
        try {
          await supabase
            .from('generations')
            .update({ status: 'failed', completed_at: new Date().toISOString() })
            .eq('id', generationId)
        } catch (e2) {
          console.error('[inngest] could not even set failed status:', e2)
        }
        throw fatalError
      }
    })

    return { success: !generationError, generationId }
  }
)

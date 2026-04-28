// app/api/inngest/route.ts
import { serve } from 'inngest/next'
import { inngest, generateFunction, researchRetryFunction } from '@/lib/inngest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateFunction, researchRetryFunction],
})

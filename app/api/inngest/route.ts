// app/api/inngest/route.ts
import { serve } from 'inngest/next'
import { inngest, generateFunction } from '@/lib/inngest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateFunction],
  signingKey: process.env.INNGEST_SIGNING_KEY,
})

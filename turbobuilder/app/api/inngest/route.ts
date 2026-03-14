import { serve } from 'inngest/next'
import { inngest, generateFunction } from '@/lib/inngest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateFunction],
})

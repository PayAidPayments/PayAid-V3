import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { classifyText } from '@payaid/ai'
import { z } from 'zod'

const bodySchema = z.object({
  text: z.string().min(1).max(32000),
  labels: z.array(z.string().min(1)).min(1).max(64),
  multiLabel: z.boolean().optional(),
})

/**
 * POST /api/ai/text/classify — zero-shot labels via local LLM (no separate HF classifier).
 */
export async function POST(request: NextRequest) {
  try {
    await requireCanonicalAiGatewayAccess(request)
    const body = await request.json()
    const input = bodySchema.parse(body)
    const out = await classifyText({
      text: input.text,
      labels: input.labels,
      multiLabel: input.multiLabel,
    })
    return NextResponse.json(out)
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    console.error('/api/ai/text/classify error:', err)
    const message = err instanceof Error ? err.message : 'Classification failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

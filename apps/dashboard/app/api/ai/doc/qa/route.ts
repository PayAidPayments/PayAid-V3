import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { qaDoc } from '@payaid/ai'
import { z } from 'zod'

const bodySchema = z.object({
  question: z.string().min(1).max(8000),
  context: z.string().min(1).max(100000),
  system: z.string().max(8000).optional(),
})

/**
 * POST /api/ai/doc/qa — answer from provided context only (retrieval/indexing is caller’s job).
 */
export async function POST(request: NextRequest) {
  try {
    await requireCanonicalAiGatewayAccess(request)
    const body = await request.json()
    const input = bodySchema.parse(body)
    const answer = await qaDoc({
      question: input.question,
      context: input.context,
      system: input.system,
    })
    return NextResponse.json({ answer })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    console.error('/api/ai/doc/qa error:', err)
    const message = err instanceof Error ? err.message : 'Document QA failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

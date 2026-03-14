/**
 * Email Reply Suggestion API Route
 * POST /api/email/suggest-reply - Suggest reply
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { suggestReply } from '@/lib/ai/email-assistant'
import { z } from 'zod'

const suggestReplySchema = z.object({
  subject: z.string(),
  body: z.string(),
  category: z.string(),
})

/** POST /api/email/suggest-reply - Suggest reply */
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = suggestReplySchema.parse(body)

    const reply = await suggestReply(validated.subject, validated.body, validated.category)

    return NextResponse.json({
      success: true,
      reply,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Reply suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to suggest reply', message: error.message },
      { status: 500 }
    )
  }
}

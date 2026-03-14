/**
 * Email Analysis API Route
 * POST /api/email/analyze - Analyze email
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { analyzeEmail } from '@/lib/ai/email-assistant'
import { z } from 'zod'

const analyzeEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  fromEmail: z.string().email(),
})

/** POST /api/email/analyze - Analyze email */
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = analyzeEmailSchema.parse(body)

    const analysis = await analyzeEmail(
      validated.subject,
      validated.body,
      validated.fromEmail
    )

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Email analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email', message: error.message },
      { status: 500 }
    )
  }
}

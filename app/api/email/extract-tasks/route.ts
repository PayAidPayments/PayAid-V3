/**
 * Extract Tasks from Email API Route
 * POST /api/email/extract-tasks - Extract tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { extractActionItems } from '@/lib/ai/email-assistant'
import { z } from 'zod'

const extractTasksSchema = z.object({
  subject: z.string(),
  body: z.string(),
})

/** POST /api/email/extract-tasks - Extract tasks */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = extractTasksSchema.parse(body)

    const actionItems = await extractActionItems(validated.subject, validated.body)

    return NextResponse.json({
      success: true,
      actionItems,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Task extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract tasks', message: error.message },
      { status: 500 }
    )
  }
}

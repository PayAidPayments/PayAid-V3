import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { parseEmail, autoProcessEmail } from '@/lib/workflow/email-parser'
import { z } from 'zod'

const parseEmailSchema = z.object({
  emailContent: z.string().min(1),
  emailSubject: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
  autoProcess: z.boolean().default(false),
})

// POST /api/workflow/email/parse - Parse email and extract data
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = parseEmailSchema.parse(body)

    if (validated.autoProcess) {
      // Auto-process: Parse and create contacts/deals/tasks
      const results = await autoProcessEmail(
        tenantId,
        validated.emailContent,
        validated.emailSubject,
        validated.fromEmail,
        validated.fromName
      )

      return NextResponse.json({
        success: true,
        parsed: true,
        autoProcessed: true,
        results,
      })
    } else {
      // Just parse
      const parsed = await parseEmail(
        tenantId,
        validated.emailContent,
        validated.emailSubject,
        validated.fromEmail,
        validated.fromName
      )

      return NextResponse.json({
        success: true,
        parsed: true,
        autoProcessed: false,
        data: parsed,
      })
    }
  } catch (error: any) {
    console.error('Email parsing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse email',
      },
      { status: 500 }
    )
  }
}


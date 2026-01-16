import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const endCallSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  duration: z.number().min(0),
  outcome: z.enum(['answered', 'voicemail', 'busy', 'no-answer', 'failed']).optional(),
})

// POST /api/crm/dialer/call/end - End a call and record outcome
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = endCallSchema.parse(body)

    // Update interaction record
    const interaction = await prisma.interaction.findFirst({
      where: {
        contactId: validated.contactId,
        tenantId,
        type: 'call',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (interaction) {
      await prisma.interaction.update({
        where: { id: interaction.id },
        data: {
          duration: validated.duration,
          outcome: validated.outcome || 'answered',
          notes: `${interaction.notes || ''}\nCall ended. Duration: ${validated.duration}s. Outcome: ${validated.outcome || 'answered'}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Call ended and recorded',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('End call error:', error)
    return NextResponse.json(
      { error: 'Failed to end call', message: error?.message },
      { status: 500 }
    )
  }
}

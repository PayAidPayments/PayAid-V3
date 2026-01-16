import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const resolveTicketSchema = z.object({
  resolution: z.string().optional(),
  aiResolved: z.boolean().optional().default(false),
  aiConfidence: z.number().optional(),
})

// POST /api/support/tickets/[id]/resolve - Resolve a ticket (AI or manual)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json()
    const validated = resolveTicketSchema.parse(body)

    // In production, update SupportTicket model
    // For now, return success

    return NextResponse.json({
      success: true,
      message: validated.aiResolved
        ? 'Ticket auto-resolved by AI'
        : 'Ticket resolved manually',
      ticket: {
        id,
        status: 'resolved',
        aiResolved: validated.aiResolved,
        aiConfidence: validated.aiConfidence,
        resolvedAt: new Date().toISOString(),
      },
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

    console.error('Resolve ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve ticket', message: error?.message },
      { status: 500 }
    )
  }
}

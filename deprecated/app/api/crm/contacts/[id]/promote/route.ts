import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const promoteSchema = z.object({
  stage: z.enum(['prospect', 'contact', 'customer']),
})

// POST /api/crm/contacts/[id]/promote - Promote contact to next stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = promoteSchema.parse(body)

    // Check if contact exists and belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Update contact stage
    const updated = await prisma.contact.update({
      where: { id: resolvedParams.id },
      data: {
        stage: validated.stage,
        // Also update type for backward compatibility
        type: validated.stage === 'prospect' ? 'lead' : validated.stage,
      },
      select: {
        id: true,
        name: true,
        email: true,
        stage: true,
        type: true,
      },
    })

    return NextResponse.json({
      success: true,
      contact: updated,
      message: `Contact promoted to ${validated.stage}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Promote contact error:', error)
    return NextResponse.json(
      { error: 'Failed to promote contact' },
      { status: 500 }
    )
  }
}


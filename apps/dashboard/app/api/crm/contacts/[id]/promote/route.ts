import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

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
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:contact:promote:${resolvedParams.id}:${idempotencyKey}`)
      const existingPromoted = (existing?.afterSnapshot as { promoted?: boolean } | null)?.promoted
      if (existing && existingPromoted) {
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 })
      }
    }

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

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:contact:promote:${resolvedParams.id}:${idempotencyKey}`, {
        contact_id: resolvedParams.id,
        promoted: true,
      })
    }

    return NextResponse.json({
      success: true,
      contact: updated,
      message: `Contact promoted to ${validated.stage}`,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
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


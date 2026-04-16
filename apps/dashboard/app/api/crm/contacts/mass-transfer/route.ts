import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'
import { logCrmAudit } from '@/lib/audit-log-crm'

const massTransferSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'At least one contact must be selected'),
  assignToUserId: z.string().min(1, 'User ID is required'),
})

// POST /api/crm/contacts/mass-transfer - Mass transfer contacts to a user
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin', 'manager'], 'contact mass transfer')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:contacts:mass_transfer:${idempotencyKey}`)
      const transferred = (existing?.afterSnapshot as { transferred?: number } | null)?.transferred
      if (existing && typeof transferred === 'number') {
        return NextResponse.json({ success: true, deduplicated: true, transferred }, { status: 200 })
      }
    }

    const body = await request.json()
    const validated = massTransferSchema.parse(body)

    // Verify the target user exists and belongs to the same tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validated.assignToUserId,
        tenantId,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found or does not belong to this tenant' },
        { status: 404 }
      )
    }

    // Verify all contacts belong to this tenant
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: validated.contactIds },
        tenantId,
      },
    })

    if (contacts.length !== validated.contactIds.length) {
      return NextResponse.json(
        { error: 'Some contacts were not found or do not belong to this tenant' },
        { status: 400 }
      )
    }

    // Update all contacts to assign them to the target user
    const result = await prisma.contact.updateMany({
      where: {
        id: { in: validated.contactIds },
        tenantId,
      },
      data: {
        assignedToId: validated.assignToUserId,
      },
    })
    await logCrmAudit({
      tenantId,
      userId,
      entityType: 'contact',
      entityId: `bulk-${validated.contactIds[0]}`,
      action: 'update',
      changeSummary: `Mass transferred ${result.count} contact(s)`,
      afterSnapshot: {
        contactIds: validated.contactIds,
        assignToUserId: validated.assignToUserId,
        transferredCount: result.count,
      },
    })

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:contacts:mass_transfer:${idempotencyKey}`, {
        transferred: result.count,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${result.count} contact(s) to ${targetUser.name || targetUser.email}`,
      transferred: result.count,
    })
  } catch (error: any) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Mass transfer contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to transfer contacts', message: error?.message },
      { status: 500 }
    )
  }
}


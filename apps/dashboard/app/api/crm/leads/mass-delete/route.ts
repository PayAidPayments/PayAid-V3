import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'
import { logCrmAudit } from '@/lib/audit-log-crm'

const massDeleteSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead must be selected'),
})

// POST /api/crm/leads/mass-delete - Mass delete leads
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin', 'manager'], 'lead mass delete')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:leads:mass_delete:${idempotencyKey}`)
      const deleted = (existing?.afterSnapshot as { deleted?: number } | null)?.deleted
      if (existing && typeof deleted === 'number') {
        return NextResponse.json({ success: true, deduplicated: true, deleted }, { status: 200 })
      }
    }

    const body = await request.json()
    const validated = massDeleteSchema.parse(body)

    // Verify all leads belong to this tenant
    const leads = await prisma.contact.findMany({
      where: {
        id: { in: validated.leadIds },
        tenantId,
      },
    })

    if (leads.length !== validated.leadIds.length) {
      return NextResponse.json(
        { error: 'Some leads were not found or do not belong to this tenant' },
        { status: 400 }
      )
    }

    // Delete all leads
    const result = await prisma.contact.deleteMany({
      where: {
        id: { in: validated.leadIds },
        tenantId,
      },
    })

    await logCrmAudit({
      tenantId,
      userId,
      entityType: 'lead',
      entityId: `bulk-${validated.leadIds[0]}`,
      action: 'delete',
      changeSummary: `Mass deleted ${result.count} lead(s)`,
      beforeSnapshot: { leadIds: validated.leadIds, deletedCount: result.count },
    })

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:leads:mass_delete:${idempotencyKey}`, {
        deleted: result.count,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} lead(s)`,
      deleted: result.count,
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

    console.error('Mass delete leads error:', error)
    return NextResponse.json(
      { error: 'Failed to delete leads', message: error?.message },
      { status: 500 }
    )
  }
}

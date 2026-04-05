/**
 * POST /api/crm/contacts/bulk-delete
 * Archive multiple contacts (soft delete) by ID. Scoped to tenant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { logCrmAudit } from '@/lib/audit-log-crm'
import { z } from 'zod'

const bodySchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1, 'At least one contact ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { contactIds } = bodySchema.parse(body)

    const result = await prisma.contact.updateMany({
      where: {
        id: { in: contactIds },
        tenantId,
      },
      data: { status: 'archived' },
    })

    await logCrmAudit({
      tenantId,
      userId,
      entityType: 'contact',
      entityId: `bulk-${contactIds[0]}`,
      action: 'delete',
      changeSummary: `Bulk archived ${result.count} contact(s)`,
      afterSnapshot: { contactIds, archivedCount: result.count },
    })

    return NextResponse.json({
      success: true,
      archived: result.count,
      contactIds,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Bulk delete contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk delete contacts', message: error?.message },
      { status: 500 }
    )
  }
}

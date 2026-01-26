import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { requestDataDeletion } from '@/lib/compliance/gdpr-data-deletion'
import { z } from 'zod'

const deletionRequestSchema = z.object({
  entityType: z.enum(['customer', 'contact', 'employee', 'invoice', 'all']),
  entityId: z.string().optional(),
  reason: z.string().optional(),
})

/**
 * POST /api/compliance/gdpr/delete
 * Request GDPR data deletion
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'compliance')

    const body = await request.json()
    const validated = deletionRequestSchema.parse(body)

    const result = await requestDataDeletion({
      tenantId,
      userId: validated.entityType === 'all' ? userId : validated.entityId || userId,
      entityType: validated.entityType,
      entityId: validated.entityId,
      reason: validated.reason,
      requestedBy: userId,
    })

    return NextResponse.json({
      success: result.success,
      deletedRecords: result.deletedRecords,
      message: result.message,
      errors: result.errors,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('GDPR deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to process deletion request', details: String(error) },
      { status: 500 }
    )
  }
}

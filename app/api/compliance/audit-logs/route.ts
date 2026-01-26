import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getAuditLogs } from '@/lib/compliance/audit-logger'
import { z } from 'zod'

const auditLogQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  action: z.string().optional(),
  dataType: z.string().optional(),
  userId: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
})

/**
 * GET /api/compliance/audit-logs
 * Get audit logs for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const { searchParams } = new URL(request.url)
    const query = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      action: searchParams.get('action') || undefined,
      dataType: searchParams.get('dataType') || undefined,
      userId: searchParams.get('userId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    }

    const validated = auditLogQuerySchema.parse(query)

    const logs = await getAuditLogs(tenantId, {
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      action: validated.action,
      dataType: validated.dataType,
      userId: validated.userId,
      limit: validated.limit,
    })

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to get audit logs', details: String(error) },
      { status: 500 }
    )
  }
}

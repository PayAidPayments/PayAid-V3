import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { runAnomalyDetection } from '@/lib/hr/anomaly-detection'

/**
 * GET /api/hr/anomalies
 * Feature #4: Anomaly Detection & Fraud Prevention. Returns list of detected anomalies (attendance, expense, leave patterns).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const items = await runAnomalyDetection(tenantId)
    return NextResponse.json({
      total: items.length,
      bySeverity: {
        HIGH: items.filter((i) => i.severity === 'HIGH').length,
        MEDIUM: items.filter((i) => i.severity === 'MEDIUM').length,
        LOW: items.filter((i) => i.severity === 'LOW').length,
      },
      items,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

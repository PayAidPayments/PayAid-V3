import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { gratuity } from '@/lib/hr/advanced-calculations'

export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    const list = [
      { id: 'PF_ECR', name: 'PF ECR', due: '15th' },
      { id: 'ESI', name: 'ESI', due: '21st' },
      { id: 'TDS_24Q', name: 'TDS 24Q', due: 'Quarterly' },
      { id: 'PT', name: 'Professional Tax', due: 'State' },
      { id: 'GRATUITY', name: 'Gratuity', due: 'On exit' },
    ]
    return NextResponse.json({
      checklist: list,
      gratuitySample: gratuity(50000, 5, 0),
      note: 'Use /api/hr/compliance/reminders for due dates.',
      generatedAt: new Date().toISOString(),
    })
  } catch (e: unknown) {
    return handleLicenseError(e)
  }
}

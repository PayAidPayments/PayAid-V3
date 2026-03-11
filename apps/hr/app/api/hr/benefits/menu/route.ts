import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #23: Benefits menu */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    return NextResponse.json({
      menu: [{ id: 'HEALTH', name: 'Health Insurance' }, { id: 'LIFE', name: 'Life Insurance' }, { id: 'NPS', name: 'NPS' }],
      note: 'Add BenefitEnrollment and workflow.',
      generatedAt: new Date().toISOString(),
    })
  } catch (e: unknown) {
    return handleLicenseError(e)
  }
}

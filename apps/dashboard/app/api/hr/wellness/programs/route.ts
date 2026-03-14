import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #24: Wellness programs */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    return NextResponse.json({ programs: [], note: 'Add WellnessProgram and enrollment.', generatedAt: new Date().toISOString() })
  } catch (e: unknown) {
    return handleLicenseError(e)
  }
}

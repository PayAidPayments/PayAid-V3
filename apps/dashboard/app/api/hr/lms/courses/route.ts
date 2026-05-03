import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #18: LMS courses (placeholder). */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    return NextResponse.json({ courses: [], note: 'Add Course model or integrate LMS.', generatedAt: new Date().toISOString() })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

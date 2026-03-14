import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #18: LMS - Progress by employee (placeholder). */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    const employeeId = request.nextUrl.searchParams.get('employeeId')
    return NextResponse.json({
      employeeId: employeeId || null,
      enrollments: [],
      note: 'Integrate with LMS to fetch enrollments and completion %.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

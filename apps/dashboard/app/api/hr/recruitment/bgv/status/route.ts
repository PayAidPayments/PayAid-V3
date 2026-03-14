import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #15: GET BGV status (placeholder; integrate with provider). */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    const ref = request.nextUrl.searchParams.get('referenceId') || request.nextUrl.searchParams.get('candidateId')
    return NextResponse.json({
      referenceId: ref || null,
      status: 'PENDING',
      checks: ['EDUCATION', 'EMPLOYMENT', 'ADDRESS'],
      message: 'Store BGV referenceId and poll provider API or webhooks to update status.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

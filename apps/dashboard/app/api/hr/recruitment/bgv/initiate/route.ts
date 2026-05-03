import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #15: Initiate BGV for candidate (placeholder for First Advantage/AuthBridge). */
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    const body = await request.json().catch(() => ({}))
    const candidateId = body.candidateId
    if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })
    return NextResponse.json({
      success: true,
      candidateId,
      bgvReferenceId: 'BGV-' + Date.now(),
      status: 'INITIATED',
      message: 'Integrate with BGV provider API to trigger verification and store referenceId.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

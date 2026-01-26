import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { InternalSignatureService } from '@/lib/signatures/internal-signature'

/**
 * GET /api/quotes/[id]/signature-status
 * Get quote signature status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const quoteId = params.id

    const status = await InternalSignatureService.getSignatureStatus(tenantId, quoteId, 'QUOTE')

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('[Quote Signature Status] Error:', error)
    return handleLicenseError(error)
  }
}

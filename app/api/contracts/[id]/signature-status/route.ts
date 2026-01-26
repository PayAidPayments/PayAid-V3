import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { InternalSignatureService } from '@/lib/signatures/internal-signature'

/**
 * GET /api/contracts/[id]/signature-status
 * Get contract signature status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const contractId = params.id

    const status = await InternalSignatureService.getSignatureStatus(tenantId, contractId, 'CONTRACT')

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('[Contract Signature Status] Error:', error)
    return handleLicenseError(error)
  }
}

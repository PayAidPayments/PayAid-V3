import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getModelConfig, routeToModel } from '@/lib/ai/model-router'
/**
 * GET /api/ai/models/[companyId]
 * Get model configuration for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    // Verify companyId matches tenantId (security check)
    if (companyId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const config = await getModelConfig(tenantId)
    const routing = await routeToModel(tenantId)

    return NextResponse.json({
      success: true,
      config,
      routing,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get model config error:', error)
    return NextResponse.json(
      { error: 'Failed to get model configuration', details: String(error) },
      { status: 500 }
    )
  }
}

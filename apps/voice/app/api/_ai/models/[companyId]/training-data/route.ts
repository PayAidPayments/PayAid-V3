import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getTrainingDataset, exportTrainingDataForFineTuning } from '@/lib/ai/company-fine-tuning'

/**
 * GET /api/ai/models/[companyId]/training-data
 * Export training data for fine-tuning
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    if (companyId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'jsonl') as 'jsonl' | 'json'

    const trainingData = await exportTrainingDataForFineTuning(tenantId, format)
    const dataset = await getTrainingDataset(tenantId)

    return NextResponse.json({
      success: true,
      format,
      data: trainingData,
      metadata: {
        totalCount: dataset?.totalCount || 0,
        qualityScore: dataset?.qualityScore || 0,
        lastUpdated: dataset?.lastUpdated || new Date(),
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Export training data error:', error)
    return NextResponse.json(
      { error: 'Failed to export training data', details: String(error) },
      { status: 500 }
    )
  }
}

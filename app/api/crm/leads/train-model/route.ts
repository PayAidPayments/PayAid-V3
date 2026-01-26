/**
 * Lead Scoring Model Training API
 * POST /api/crm/leads/train-model - Train scoring model from historical data
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { trainScoringModel } from '@/lib/ai/lead-scoring/pipeline'

// POST /api/crm/leads/train-model - Train scoring model
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Train the model
    const result = await trainScoringModel(tenantId)

    return NextResponse.json({
      success: true,
      model: {
        weights: result.weights,
        accuracy: result.accuracy,
        sampleSize: result.sampleSize,
        trainedAt: new Date().toISOString(),
      },
      message: `Model trained successfully with ${result.sampleSize} samples`,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Model training error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to train model',
      },
      { status: 500 }
    )
  }
}

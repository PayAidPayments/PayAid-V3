/**
 * Workflow Analysis API
 * Analyzes workflows and identifies bottlenecks
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { analyzeWorkflows } from '@/lib/ai/workflow-analyzer'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    // Analyze workflows
    const analysis = await analyzeWorkflows(tenantId)

    return NextResponse.json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[WORKFLOW_ANALYZE] Error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to analyze workflows',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Experiment Results API
 * GET /api/v1/voice-agents/experiments/[id]/results - Get experiment results
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getABTestingFramework } from '@/lib/voice-agent/ab-testing'
import { prisma } from '@/lib/db/prisma'

// GET /api/v1/voice-agents/experiments/[id]/results - Get experiment results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify experiment belongs to tenant
    const experiment = await prisma.voiceAgentExperiment.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    const abTesting = getABTestingFramework()
    const results = await abTesting.getExperimentResults(params.id)

    return NextResponse.json(results)
  } catch (error) {
    console.error('[Experiments] Get results error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get results' },
      { status: 500 }
    )
  }
}

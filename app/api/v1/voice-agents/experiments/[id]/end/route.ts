/**
 * End Experiment API
 * POST /api/v1/voice-agents/experiments/[id]/end - End experiment and get results
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getABTestingFramework } from '@/lib/voice-agent/ab-testing'
import { prisma } from '@/lib/db/prisma'

// POST /api/v1/voice-agents/experiments/[id]/end - End experiment
export async function POST(
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
    const results = await abTesting.endExperiment(params.id)

    return NextResponse.json({ success: true, status: 'completed', results })
  } catch (error) {
    console.error('[Experiments] End error:', error)
    return NextResponse.json(
      { error: 'Failed to end experiment' },
      { status: 500 }
    )
  }
}

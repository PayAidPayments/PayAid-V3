/**
 * Pause Experiment API
 * POST /api/v1/voice-agents/experiments/[id]/pause - Pause experiment
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getABTestingFramework } from '@/lib/voice-agent/ab-testing'
import { prisma } from '@payaid/db'

// POST /api/v1/voice-agents/experiments/[id]/pause - Pause experiment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify experiment belongs to tenant
    const experiment = await prisma.voiceAgentExperiment.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId,
      },
    })

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    const abTesting = getABTestingFramework()
    await abTesting.pauseExperiment(id)

    return NextResponse.json({ success: true, status: 'paused' })
  } catch (error) {
    console.error('[Experiments] Pause error:', error)
    return NextResponse.json(
      { error: 'Failed to pause experiment' },
      { status: 500 }
    )
  }
}

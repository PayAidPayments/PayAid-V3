import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { enhancedLearning, recordReward, updatePolicy } from '@/lib/ai/reinforcement-learning'
import { z } from 'zod'

const rewardSchema = z.object({
  action: z.string().min(1),
  reward: z.number().min(-1).max(1),
  context: z.string().min(1),
})

// POST /api/ai/learning/reinforcement/reward - Record reward signal
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = rewardSchema.parse(body)

    await recordReward(tenantId, {
      ...validated,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Reward signal recorded. Policy will be updated based on this feedback.',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Record reward error:', error)
    return NextResponse.json(
      { error: 'Failed to record reward', message: error?.message },
      { status: 500 }
    )
  }
}

// GET /api/ai/learning/reinforcement - Get enhanced learning insights with RL
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const learning = await enhancedLearning(tenantId)

    return NextResponse.json({
      ...learning,
      message: 'Enhanced learning insights generated with reinforcement learning.',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get enhanced learning error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights', message: error?.message },
      { status: 500 }
    )
  }
}

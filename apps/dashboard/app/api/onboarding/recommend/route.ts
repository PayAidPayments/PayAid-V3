import { NextRequest, NextResponse } from 'next/server'
import { getRecommendedModules } from '@/lib/onboarding/industry-presets'
import { z } from 'zod'

const recommendSchema = z.object({
  industryIds: z.array(z.string()),
  goals: z.array(z.string()),
  businessComplexity: z.enum(['single', 'multiple-locations', 'multiple-lines']),
})

// POST /api/onboarding/recommend - Get module recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = recommendSchema.parse(body)

    const recommendations = getRecommendedModules(
      validated.industryIds,
      validated.goals,
      validated.businessComplexity
    )

    return NextResponse.json({
      recommendations,
      message: 'Module recommendations generated successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}


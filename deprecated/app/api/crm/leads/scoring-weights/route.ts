/**
 * Custom Scoring Weights API
 * GET/POST /api/crm/leads/scoring-weights - Get/Set custom scoring weights
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const scoringWeightsSchema = z.object({
  engagement: z.number().min(0).max(1),
  demographic: z.number().min(0).max(1),
  behavioral: z.number().min(0).max(1),
  historical: z.number().min(0).max(1),
  vertical: z.enum(['fintech', 'd2c', 'agencies', 'default']).optional(),
})

// GET /api/crm/leads/scoring-weights - Get scoring weights
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get from tenant industrySettings or return defaults
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industrySettings: true },
    })

    const defaultWeights = {
      engagement: 0.30,
      demographic: 0.25,
      behavioral: 0.25,
      historical: 0.20,
    }

    const weights = (tenant?.industrySettings as any)?.scoringWeights || defaultWeights

    return NextResponse.json({
      success: true,
      weights,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get scoring weights error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scoring weights' },
      { status: 500 }
    )
  }
}

// POST /api/crm/leads/scoring-weights - Set scoring weights
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = scoringWeightsSchema.parse(body)

    // Validate weights sum to ~1.0
    const total = validated.engagement + validated.demographic + validated.behavioral + validated.historical
    if (Math.abs(total - 1.0) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Weights must sum to 1.0' },
        { status: 400 }
      )
    }

    // Update tenant industrySettings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industrySettings: true },
    })

    const settings = (tenant?.industrySettings as any) || {}
    settings.scoringWeights = {
      engagement: validated.engagement,
      demographic: validated.demographic,
      behavioral: validated.behavioral,
      historical: validated.historical,
    }

    if (validated.vertical) {
      settings.scoringVertical = validated.vertical
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { industrySettings: settings as any },
    })

    return NextResponse.json({
      success: true,
      weights: settings.scoringWeights,
      message: 'Scoring weights updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Set scoring weights error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set scoring weights' },
      { status: 500 }
    )
  }
}

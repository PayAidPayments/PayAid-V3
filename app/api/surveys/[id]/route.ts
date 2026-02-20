/**
 * Survey Detail API Route
 * GET /api/surveys/[id] - Get survey
 * PATCH /api/surveys/[id] - Update survey
 * DELETE /api/surveys/[id] - Delete survey
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// GET /api/surveys/[id] - Get survey with analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const survey = await prisma.survey.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        responses: {
          where: { status: 'completed' },
          take: 10,
          orderBy: { completedAt: 'desc' },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }

    // Calculate analytics
    const totalResponses = survey._count.responses
    const completedResponses = await prisma.surveyResponse.count({
      where: {
        surveyId: params.id,
        status: 'completed',
      },
    })

    const sentResponses = await prisma.surveyResponse.count({
      where: {
        surveyId: params.id,
        status: { in: ['sent', 'opened', 'in_progress', 'completed'] },
      },
    })

    const responseRate = sentResponses > 0 ? (completedResponses / sentResponses) * 100 : 0

    // Calculate NPS if applicable
    let npsScore: number | null = null
    if (survey.type === 'nps' || survey.type === 'satisfaction') {
      const npsResponses = await prisma.surveyResponse.findMany({
        where: {
          surveyId: params.id,
          npsScore: { not: null },
        },
        select: { npsScore: true },
      })

      if (npsResponses.length > 0) {
        const promoters = npsResponses.filter((r) => (r.npsScore ?? 0) >= 9).length
        const detractors = npsResponses.filter((r) => (r.npsScore ?? 0) <= 6).length
        npsScore = ((promoters - detractors) / npsResponses.length) * 100
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...survey,
        analytics: {
          totalResponses,
          completedResponses,
          sentResponses,
          responseRate: Math.round(responseRate * 100) / 100,
          npsScore: npsScore ? Math.round(npsScore * 100) / 100 : null,
        },
      },
    })
  } catch (error: any) {
    console.error('Get survey error:', error)
    return NextResponse.json(
      { error: 'Failed to get survey', message: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/surveys/[id] - Update survey
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const updateData: any = {}

    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.status) updateData.status = body.status
    if (body.questions) updateData.questions = body.questions
    if (body.settings) updateData.settings = body.settings
    if (body.targetAudience) updateData.targetAudience = body.targetAudience
    if (body.distributionChannels) updateData.distributionChannels = body.distributionChannels

    const survey = await prisma.survey.update({
      where: {
        id: params.id,
        tenantId,
      },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: survey,
    })
  } catch (error: any) {
    console.error('Update survey error:', error)
    return NextResponse.json(
      { error: 'Failed to update survey', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/surveys/[id] - Delete survey
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    await prisma.survey.delete({
      where: {
        id: params.id,
        tenantId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Survey deleted',
    })
  } catch (error: any) {
    console.error('Delete survey error:', error)
    return NextResponse.json(
      { error: 'Failed to delete survey', message: error.message },
      { status: 500 }
    )
  }
}

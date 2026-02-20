/**
 * Surveys API Route
 * GET /api/surveys - List surveys
 * POST /api/surveys - Create survey
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createSurveySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  type: z.enum(['satisfaction', 'nps', 'feedback', 'custom']).default('satisfaction'),
  questions: z.array(z.object({
    questionText: z.string().min(1),
    questionType: z.enum(['text', 'rating', 'nps', 'multiple_choice', 'yes_no', 'scale']),
    options: z.array(z.string()).optional(),
    required: z.boolean().default(false),
    order: z.number().default(0),
    conditionalLogic: z.any().optional(),
    validation: z.any().optional(),
  })),
  settings: z.object({
    autoSend: z.boolean().default(false),
    sendAfterDays: z.number().optional(),
    reminderDays: z.array(z.number()).optional(),
    thankYouMessage: z.string().optional(),
    redirectUrl: z.string().url().optional(),
  }).optional(),
  targetAudience: z.object({
    contactTypes: z.array(z.string()).optional(),
    dealStages: z.array(z.string()).optional(),
    minDealValue: z.number().optional(),
  }).optional(),
  distributionChannels: z.array(z.enum(['email', 'sms', 'whatsapp', 'web'])).default(['email']),
})

// GET /api/surveys - List surveys
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = { tenantId }
    if (status) where.status = status
    if (type) where.type = type

    const surveys = await prisma.survey.findMany({
      where,
      include: {
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: surveys,
    })
  } catch (error: any) {
    console.error('List surveys error:', error)
    return NextResponse.json(
      { error: 'Failed to list surveys', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/surveys - Create survey
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createSurveySchema.parse(body)

    const existing = await prisma.survey.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Survey slug already exists' },
        { status: 400 }
      )
    }

    const survey = await prisma.survey.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        slug: validated.slug,
        type: validated.type,
        questions: validated.questions,
        settings: validated.settings || {},
        targetAudience: validated.targetAudience,
        distributionChannels: validated.distributionChannels,
        createdById: userId,
      },
    })

    return NextResponse.json({
      success: true,
      data: survey,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create survey error:', error)
    return NextResponse.json(
      { error: 'Failed to create survey', message: error.message },
      { status: 500 }
    )
  }
}

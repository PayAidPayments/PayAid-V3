import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createCallingBotSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  greeting: z.string().optional(),
  faqKnowledgeBase: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
})

// GET /api/ai-calling - List all AI calling bots
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const bots = await prisma.aICallingBot.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bots })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get AI calling bots error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI calling bots', bots: [] },
      { status: 500 }
    )
  }
}

// POST /api/ai-calling - Create a new AI calling bot
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createCallingBotSchema.parse(body)

    const bot = await prisma.aICallingBot.create({
      data: {
        name: validated.name,
        phoneNumber: validated.phoneNumber,
        greeting: validated.greeting,
        faqKnowledgeBase: validated.faqKnowledgeBase || [],
        tenantId,
        isActive: true,
      },
    })

    return NextResponse.json(bot, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create AI calling bot error:', error)
    return NextResponse.json(
      { error: 'Failed to create AI calling bot' },
      { status: 500 }
    )
  }
}


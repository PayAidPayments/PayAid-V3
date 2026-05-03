import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateBotSchema = z.object({
  name: z.string().min(1).optional(),
  greeting: z.string().optional(),
  faqKnowledgeBase: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/ai-calling/[id] - Get a specific AI calling bot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const bot = await prisma.aICallingBot.findFirst({
      where: { id, tenantId },
    })

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ bot })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get AI calling bot error:', error)
    return NextResponse.json(
      { error: 'Failed to get bot' },
      { status: 500 }
    )
  }
}

// PATCH /api/ai-calling/[id] - Update AI calling bot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json()
    const validated = updateBotSchema.parse(body)

    const bot = await prisma.aICallingBot.findFirst({
      where: { id, tenantId },
    })

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.aICallingBot.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.greeting !== undefined && { greeting: validated.greeting }),
        ...(validated.faqKnowledgeBase && { faqKnowledgeBase: validated.faqKnowledgeBase }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    })

    return NextResponse.json({ bot: updated })
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
    console.error('Update AI calling bot error:', error)
    return NextResponse.json(
      { error: 'Failed to update bot' },
      { status: 500 }
    )
  }
}

// DELETE /api/ai-calling/[id] - Delete AI calling bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const bot = await prisma.aICallingBot.findFirst({
      where: { id, tenantId },
    })

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    await prisma.aICallingBot.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete AI calling bot error:', error)
    return NextResponse.json(
      { error: 'Failed to delete bot' },
      { status: 500 }
    )
  }
}


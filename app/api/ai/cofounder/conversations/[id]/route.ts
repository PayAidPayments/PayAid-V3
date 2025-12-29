import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateConversationSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string(),
    agent: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
  })),
  suggestedActions: z.array(z.object({
    action: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  })).optional(),
  title: z.string().optional(),
})

// GET /api/ai/cofounder/conversations/[id] - Get single conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const conversation = await prisma.aICofounderConversation.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
        userId,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    )
  }
}

// PATCH /api/ai/cofounder/conversations/[id] - Update conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = updateConversationSchema.parse(body)

    const conversation = await prisma.aICofounderConversation.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
        userId,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const updated = await prisma.aICofounderConversation.update({
      where: { id: resolvedParams.id },
      data: {
        messages: validated.messages,
        messageCount: validated.messages.length,
        lastMessageAt: new Date(),
        ...(validated.suggestedActions && { suggestedActions: validated.suggestedActions }),
        ...(validated.title && { title: validated.title }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

// DELETE /api/ai/cofounder/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const conversation = await prisma.aICofounderConversation.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
        userId,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    await prisma.aICofounderConversation.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}


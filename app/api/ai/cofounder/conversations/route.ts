import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const createConversationSchema = z.object({
  title: z.string().optional(),
  agentId: z.string(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string(),
    agent: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
  })),
})

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
})

// GET /api/ai/cofounder/conversations - List all conversations
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const agentId = searchParams.get('agentId')

    const where: any = {
      tenantId,
      userId,
    }

    if (agentId) {
      where.agentId = agentId
    }

    const [conversations, total] = await Promise.all([
      prisma.aICofounderConversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          agentId: true,
          messageCount: true,
          lastMessageAt: true,
          createdAt: true,
          suggestedActions: true,
        },
      }),
      prisma.aICofounderConversation.count({ where }),
    ])

    return NextResponse.json({ conversations, total })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    )
  }
}

// POST /api/ai/cofounder/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = createConversationSchema.parse(body)

    // Auto-generate title from first user message if not provided
    const title = validated.title || validated.messages.find(m => m.role === 'user')?.content.substring(0, 50) || 'New Conversation'

    const conversation = await prisma.aICofounderConversation.create({
      data: {
        tenantId,
        userId,
        title,
        agentId: validated.agentId,
        messages: validated.messages,
        messageCount: validated.messages.length,
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}


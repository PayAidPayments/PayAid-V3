import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const convertToTaskSchema = z.object({
  action: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
  contactId: z.string().optional(),
  conversationId: z.string().optional(),
})

// POST /api/ai/cofounder/actions/convert-to-task - Convert AI recommendation to task
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm') // Tasks are part of CRM

    const body = await request.json()
    const validated = convertToTaskSchema.parse(body)

    // Create task from AI recommendation
    const task = await prisma.task.create({
      data: {
        tenantId,
        title: validated.action,
        description: validated.description || `Created from AI Co-founder recommendation`,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        contactId: validated.contactId,
        assignedToId: userId, // Assign to the user who created it
        status: 'pending',
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // If conversationId is provided, update the conversation's suggestedActions
    if (validated.conversationId) {
      try {
        const conversation = await prisma.aICofounderConversation.findFirst({
          where: {
            id: validated.conversationId,
            tenantId,
            userId,
          },
        })

        if (conversation && conversation.suggestedActions) {
          const actions = conversation.suggestedActions as any[]
          const updatedActions = actions.map((action: any) => {
            if (action.action === validated.action) {
              return {
                ...action,
                converted: true,
                taskId: task.id,
                convertedAt: new Date().toISOString(),
              }
            }
            return action
          })

          await prisma.aICofounderConversation.update({
            where: { id: validated.conversationId },
            data: { suggestedActions: updatedActions },
          })
        }
      } catch (err) {
        // Don't fail if conversation update fails
        console.error('Failed to update conversation actions:', err)
      }
    }

    return NextResponse.json({
      success: true,
      task,
      message: 'Task created successfully',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Convert to task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}


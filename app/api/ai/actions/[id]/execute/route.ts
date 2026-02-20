/**
 * Execute AI Action
 * Executes a suggested action from PayAid Agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/middleware/api-key-auth'
import { prisma } from '@/lib/db/prisma'

/** POST /api/ai/actions/[id]/execute - Execute an action */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    const { id } = await params
    const body = await request.json()
    const { context } = body

    // Map action IDs to actual operations
    switch (id) {
      case 'create-task':
        if (context?.contactId) {
          await prisma.task.create({
            data: {
              tenantId: authResult.tenantId,
              contactId: context.contactId,
              title: `Follow up with contact`,
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
              status: 'pending',
              priority: 'medium',
            },
          })
        }
        break

      case 'create-deal':
        if (context?.contactId) {
          const contact = await prisma.contact.findFirst({
            where: { id: context.contactId, tenantId: authResult.tenantId },
          })
          if (contact) {
            await prisma.deal.create({
              data: {
                tenantId: authResult.tenantId,
                contactId: contact.id,
                name: `Deal for ${contact.name}`,
                stage: 'prospecting',
                value: 0,
              },
            })
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] ai/actions/[id]/execute POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute action' },
      { status: 500 }
    )
  }
}

/**
 * AI Suggestions API
 * Provides context-aware action suggestions for PayAid Agent (browser extension)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/middleware/api-key-auth'
import { prisma } from '@/lib/db/prisma'

/** POST /api/ai/suggestions - Get AI suggestions for current context */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    const body = await request.json()
    const { context } = body

    if (!context || !context.type || !context.id) {
      return NextResponse.json(
        { error: 'context.type and context.id are required' },
        { status: 400 }
      )
    }

    const suggestions = []

    if (context.type === 'contact') {
      const contact = await prisma.contact.findFirst({
        where: { id: context.id, tenantId: authResult.tenantId },
      })

      if (contact) {
        // Suggest actions based on contact state
        if (contact.stage === 'prospect') {
          suggestions.push({
            id: 'create-deal',
            title: 'Create Deal',
            description: `Start a deal for ${contact.name}`,
            actionLabel: 'Create Deal',
            action: 'create_deal',
          })
        }

        suggestions.push({
          id: 'create-task',
          title: 'Create Follow-up Task',
          description: `Schedule a follow-up with ${contact.name}`,
          actionLabel: 'Create Task',
          action: 'create_task',
        })

        if (contact.email) {
          suggestions.push({
            id: 'send-email',
            title: 'Send Email',
            description: `Send an email to ${contact.email}`,
            actionLabel: 'Send Email',
            action: 'send_email',
          })
        }
      }
    }

    if (context.type === 'deal') {
      const deal = await prisma.deal.findFirst({
        where: { id: context.id, tenantId: authResult.tenantId },
      })

      if (deal) {
        if (deal.stage === 'prospecting') {
          suggestions.push({
            id: 'move-to-qualification',
            title: 'Move to Qualification',
            description: 'Advance this deal to the next stage',
            actionLabel: 'Move Stage',
            action: 'update_deal_stage',
          })
        }

        suggestions.push({
          id: 'create-invoice',
          title: 'Create Invoice',
          description: `Generate invoice for ${deal.name}`,
          actionLabel: 'Create Invoice',
          action: 'create_invoice',
        })
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[API] ai/suggestions POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}

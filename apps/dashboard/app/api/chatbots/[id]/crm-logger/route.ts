import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import {
  INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
  processInboundLead,
} from '@/lib/crm/inbound-orchestration'

const logLeadSchema = z.object({
  visitorId: z.string(),
  sessionId: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/chatbots/[id]/crm-logger - Manually log a lead to CRM
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = logLeadSchema.parse(body)

    const chatbot = await prisma.websiteChatbot.findUnique({
      where: { id },
      include: {
        website: true,
      },
    })

    if (!chatbot || !chatbot.isActive) {
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404 }
      )
    }

    const inbound = await processInboundLead({
      tenantId: chatbot.tenantId,
      actorUserId: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
      dedupePolicy: 'merge_existing',
      source: {
        sourceChannel: 'website_chatbot',
        sourceSubchannel: chatbot.id,
        sourceRef: validated.sessionId,
        capturedBy: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
        rawMetadata: {
          visitorId: validated.visitorId,
          chatbotId: chatbot.id,
          ...(validated.metadata || {}),
        },
      },
      legacySourceLabel: 'website',
      contact: {
        name: validated.name || 'Website Visitor',
        email: validated.email ?? null,
        phone: validated.phone ?? null,
        company: validated.company ?? null,
        type: 'lead',
        stage: 'prospect',
        status: 'active',
        notes: validated.message ?? undefined,
        attributionChannel: 'organic',
      },
    })

    if (!inbound.ok || !inbound.contact.id) {
      return NextResponse.json(
        { error: inbound.error?.message || 'Failed to log lead to CRM' },
        { status: inbound.error?.code === 'CONTACT_LIMIT' ? 403 : 500 }
      )
    }

    const contact = await prisma.contact.findFirst({
      where: { id: inbound.contact.id, tenantId: chatbot.tenantId },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found after ingest' }, { status: 500 })
    }

    // Create deal if contact is qualified
    let deal = null
    if (contact && (validated.email || validated.phone)) {
      // Check if deal already exists
      const existingDeal = await prisma.deal.findFirst({
        where: {
          tenantId: chatbot.tenantId,
          contactId: contact.id,
          stage: 'lead',
        },
      })

      if (!existingDeal) {
        deal = await prisma.deal.create({
          data: {
            tenantId: chatbot.tenantId,
            name: `Lead from ${chatbot.website?.domain || chatbot.website?.subdomain || 'Website'}`,
            value: 0,
            probability: 20,
            stage: 'lead',
            contactId: contact.id,
          },
        })
      } else {
        deal = existingDeal
      }
    }

    // Update conversation if it exists
    const conversation = await prisma.chatbotConversation.findFirst({
      where: {
        chatbotId: chatbot.id,
        sessionId: validated.sessionId,
      },
    })

    if (conversation) {
      await prisma.chatbotConversation.update({
        where: { id: conversation.id },
        data: {
          contactId: contact.id,
          leadId: deal?.id,
          qualified: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
      },
      deal: deal ? {
        id: deal.id,
        name: deal.name,
      } : null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('CRM logger error:', error)
    return NextResponse.json(
      { error: 'Failed to log lead to CRM' },
      { status: 500 }
    )
  }
}


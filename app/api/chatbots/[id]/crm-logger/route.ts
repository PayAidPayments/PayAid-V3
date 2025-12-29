import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

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
    })

    if (!chatbot || !chatbot.isActive) {
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404 }
      )
    }

    // Check if contact already exists
    let contact = null
    if (validated.email) {
      contact = await prisma.contact.findFirst({
        where: {
          tenantId: chatbot.tenantId,
          email: validated.email,
        },
      })
    }

    // Create or update contact
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          tenantId: chatbot.tenantId,
          name: validated.name || 'Website Visitor',
          email: validated.email,
          phone: validated.phone,
          company: validated.company,
          type: 'lead',
          source: 'website',
          sourceData: {
            chatbotId: chatbot.id,
            sessionId: validated.sessionId,
            visitorId: validated.visitorId,
            metadata: validated.metadata || {},
          } as any,
          attributionChannel: 'organic',
        },
      })
    } else {
      // Update existing contact with new info
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: validated.name || contact.name,
          phone: validated.phone || contact.phone,
          company: validated.company || contact.company,
        },
      })
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


/**
 * Send Survey API Route
 * POST /api/surveys/[id]/send - Send survey to contacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const sendSurveySchema = z.object({
  contactIds: z.array(z.string()).optional(),
  segment: z.string().optional(), // Send to segment
  channel: z.enum(['email', 'sms', 'whatsapp']).default('email'),
})

// POST /api/surveys/[id]/send - Send survey to contacts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const survey = await prisma.survey.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }

    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'Survey must be active to send' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = sendSurveySchema.parse(body)

    // Get contacts to send to
    let contacts: any[] = []
    if (validated.contactIds && validated.contactIds.length > 0) {
      contacts = await prisma.contact.findMany({
        where: {
          id: { in: validated.contactIds },
          tenantId,
        },
      })
    } else if (survey.targetAudience) {
      // Filter by target audience
      const where: any = { tenantId }
      const audience = survey.targetAudience as any

      if (audience.contactTypes) {
        where.stage = { in: audience.contactTypes }
      }

      contacts = await prisma.contact.findMany({
        where,
        take: 100, // Limit to 100 contacts per batch
      })
    } else {
      return NextResponse.json(
        { error: 'No contacts specified' },
        { status: 400 }
      )
    }

    // Create survey responses and send
    const responses = []
    for (const contact of contacts) {
      const response = await prisma.surveyResponse.create({
        data: {
          surveyId: params.id,
          tenantId,
          contactId: contact.id,
          contactEmail: contact.email,
          contactName: contact.name,
          channel: validated.channel,
          status: 'sent',
          sentAt: new Date(),
        },
      })

      // TODO: Send via email/SMS/WhatsApp based on channel
      // For now, just create the response record

      responses.push(response)
    }

    return NextResponse.json({
      success: true,
      message: `Survey sent to ${responses.length} contacts`,
      data: { sent: responses.length },
    })
  } catch (error: any) {
    console.error('Send survey error:', error)
    return NextResponse.json(
      { error: 'Failed to send survey', message: error.message },
      { status: 500 }
    )
  }
}

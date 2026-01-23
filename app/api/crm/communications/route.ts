/**
 * CRM Communications API Route
 * GET /api/crm/communications - List communications (unified inbox)
 * POST /api/crm/communications - Log communication
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse, Communication } from '@/types/base-modules'
import { z } from 'zod'

const CreateCommunicationSchema = z.object({
  organizationId: z.string().uuid(),
  channel: z.enum(['email', 'whatsapp', 'sms', 'in_app']),
  direction: z.enum(['inbound', 'outbound']),
  senderContactId: z.string().uuid(),
  senderName: z.string(),
  senderAddress: z.string(),
  recipientContactId: z.string().uuid().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
  linkedTo: z
    .object({
      type: z.enum(['invoice', 'project', 'case', 'order']),
      id: z.string(),
    })
    .optional(),
})

/**
 * Get communications (unified inbox)
 * GET /api/crm/communications?organizationId=xxx&contactId=xxx&channel=email&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const contactId = searchParams.get('contactId')
    const channel = searchParams.get('channel') as Communication['channel'] | null
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          error: {
            code: 'MISSING_ORGANIZATION_ID',
            message: 'organizationId is required',
          },
        },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {}

    if (contactId) {
      where.contactId = contactId
    }

    // NOTE: channel param currently isn't applied because interaction.type is used as the source.
    // Keeping it parsed for forward compatibility.
    void channel

    // Get communications from interactions table
    const [communications, total] = await Promise.all([
      prisma.interaction
        .findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                tenantId: true,
              },
            },
          },
        })
        .catch(() => []),
      prisma.interaction.count({ where }).catch(() => 0),
    ])

    // Filter by organizationId using contact's tenantId
    const filteredCommunications = communications.filter(
      (interaction) => interaction.contact?.tenantId === organizationId
    )

    const formattedCommunications: Communication[] = filteredCommunications.map((interaction) => ({
      id: interaction.id,
      organizationId: interaction.contact?.tenantId || organizationId,
      channel: (interaction.type === 'email'
        ? 'email'
        : interaction.type === 'whatsapp'
          ? 'whatsapp'
          : interaction.type === 'sms'
            ? 'sms'
            : 'in_app') as Communication['channel'],
      direction: 'outbound' as Communication['direction'],
      senderContactId: interaction.contactId || '',
      senderName: interaction.contact?.name || 'Unknown',
      senderAddress: interaction.contact?.email || interaction.contact?.phone || '',
      recipientContactId: undefined,
      subject: interaction.subject || undefined,
      message: interaction.notes || '',
      attachments: [],
      status: 'sent' as Communication['status'],
      createdAt: interaction.createdAt,
    }))

    const response: ApiResponse<{
      communications: Communication[]
      total: number
      page: number
      pageSize: number
    }> = {
      success: true,
      statusCode: 200,
      data: {
        communications: formattedCommunications,
        total,
        page,
        pageSize,
      },
      meta: {
        pagination: {
          page,
          pageSize,
          total,
        },
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in CRM communications GET route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * Log a new communication
 * POST /api/crm/communications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateCommunicationSchema.parse(body)

    // Create interaction record
    const interaction = await prisma.interaction.create({
      data: {
        contactId: validatedData.senderContactId,
        type: validatedData.channel,
        subject: validatedData.subject || null,
        notes: validatedData.message,
      },
    })

    // Get contact to get tenantId
    const contact = await prisma.contact.findUnique({
      where: { id: validatedData.senderContactId },
      select: { tenantId: true },
    })

    const communication: Communication = {
      id: interaction.id,
      organizationId: contact?.tenantId || validatedData.organizationId,
      channel: validatedData.channel,
      direction: validatedData.direction,
      senderContactId: validatedData.senderContactId,
      senderName: validatedData.senderName,
      senderAddress: validatedData.senderAddress,
      recipientContactId: validatedData.recipientContactId,
      subject: validatedData.subject,
      message: validatedData.message,
      attachments: [],
      status: 'sent',
      linkedTo: validatedData.linkedTo,
      createdAt: interaction.createdAt,
    }

    const response: ApiResponse<Communication> = {
      success: true,
      statusCode: 201,
      data: communication,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in CRM communications POST route:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, statusCode: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

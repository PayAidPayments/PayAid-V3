/**
 * CRM Communications API Route
 * GET /api/crm/communications - List communications (unified inbox)
 * POST /api/crm/communications - Log communication
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
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
export const GET = withErrorHandling(async (request: NextRequest) => {
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

  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (contactId) {
        where.OR = [
          { senderContactId: contactId },
          { recipientContactId: contactId },
        ]
  }

  if (channel) {
    where.channel = channel
  }

  // Get communications from interactions table (if it exists) or create a unified view
  // For now, we'll use a simplified approach
  const [communications, total] = await Promise.all([
    prisma.interaction.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    }).catch(() => []),
    prisma.interaction.count({ where }).catch(() => 0),
  ])

  const formattedCommunications: Communication[] = communications.map((interaction) => ({
    id: interaction.id,
    organizationId: interaction.tenantId,
    channel: (interaction.channel || 'email') as Communication['channel'],
    direction: (interaction.direction || 'outbound') as Communication['direction'],
    senderContactId: interaction.contactId || '',
    senderName: interaction.contact?.firstName
      ? `${interaction.contact.firstName} ${interaction.contact.lastName}`
      : interaction.contact?.email || 'Unknown',
    senderAddress: interaction.contact?.email || interaction.contact?.phone || '',
    recipientContactId: undefined,
    subject: interaction.subject || undefined,
    message: interaction.notes || interaction.description || '',
    attachments: [],
    status: (interaction.status || 'sent') as Communication['status'],
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
})

/**
 * Log a new communication
 * POST /api/crm/communications
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateCommunicationSchema.parse(body)

  // Create interaction record
  const interaction = await prisma.interaction.create({
    data: {
      tenantId: validatedData.organizationId,
      contactId: validatedData.senderContactId,
      type: validatedData.channel,
      channel: validatedData.channel,
      direction: validatedData.direction,
      subject: validatedData.subject,
      notes: validatedData.message,
      description: validatedData.message,
      status: 'sent',
    },
  })

  const communication: Communication = {
    id: interaction.id,
    organizationId: interaction.tenantId,
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
})

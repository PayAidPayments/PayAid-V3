/**
 * Communication Unified Inbox API Route
 * GET /api/communication/inbox - Get unified inbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, Communication } from '@/types/base-modules'

/**
 * Get unified inbox
 * GET /api/communication/inbox?organizationId=xxx&channel=email&contactId=xxx&page=1&pageSize=20
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const channel = searchParams.get('channel') as Communication['channel'] | null
  const contactId = searchParams.get('contactId')
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

  // Get communications from interactions table
  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (channel) {
    where.channel = channel
  }

  if (contactId) {
    where.OR = [
      { contactId },
      { recipientContactId: contactId },
    ]
  }

  const [interactions, total] = await Promise.all([
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

  const communications: Communication[] = interactions.map((interaction) => ({
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
      communications,
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

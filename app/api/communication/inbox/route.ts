/**
 * Communication Unified Inbox API Route
 * GET /api/communication/inbox - Get unified inbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse, Communication } from '@/types/base-modules'

/**
 * Get unified inbox
 * GET /api/communication/inbox?organizationId=xxx&channel=email&contactId=xxx&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
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
    // Note: Interaction model doesn't have tenantId, so we filter by contact's tenantId
    const where: Record<string, unknown> = {}

    if (contactId) {
      where.contactId = contactId
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
              name: true,
              email: true,
              phone: true,
              tenantId: true,
            },
          },
        },
      }).catch(() => []),
      prisma.interaction.count({ where }).catch(() => 0),
    ])

    // Filter by organizationId using contact's tenantId
    const filteredInteractions = interactions.filter(
      (interaction) => interaction.contact?.tenantId === organizationId
    )

    const communications: Communication[] = filteredInteractions.map((interaction) => ({
      id: interaction.id,
      organizationId: interaction.contact?.tenantId || organizationId,
      channel: (interaction.type === 'email' ? 'email' : interaction.type === 'whatsapp' ? 'whatsapp' : interaction.type === 'sms' ? 'sms' : 'in_app') as Communication['channel'],
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
        communications,
        total: filteredInteractions.length,
        page,
        pageSize,
      },
      meta: {
        pagination: {
          page,
          pageSize,
          total: filteredInteractions.length,
        },
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in communication inbox route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

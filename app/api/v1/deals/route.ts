/**
 * Public API v1: Deals endpoint
 * Supports both JWT (internal) and API key (external) authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateApiRequest, requireScope } from '@/lib/middleware/api-key-auth'

/** GET /api/v1/deals - List deals (public API) */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    if (authResult.authType === 'api_key') {
      const hasScope = requireScope(['read:deals'])(authResult)
      if (!hasScope) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Required scope: read:deals' },
          { status: 403 }
        )
      }
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const stage = searchParams.get('stage')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: authResult.tenantId,
    }

    if (stage) {
      where.stage = stage
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          probability: true,
          contactId: true,
          contactName: true,
          contactEmail: true,
          expectedCloseDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.deal.count({ where }),
    ])

    return NextResponse.json({
      data: deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] v1/deals GET', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

/** POST /api/v1/deals - Create deal (public API) */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    if (authResult.authType === 'api_key') {
      const hasScope = requireScope(['write:deals'])(authResult)
      if (!hasScope) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Required scope: write:deals' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const {
      name,
      value,
      stage = 'prospecting',
      probability,
      contactId,
      contactName,
      contactEmail,
      contactPhone,
      expectedCloseDate,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Find or create contact if contactId not provided
    let finalContactId = contactId
    if (!finalContactId && contactName) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          tenantId: authResult.tenantId,
          OR: [
            { email: contactEmail || undefined },
            { phone: contactPhone || undefined },
            { name: contactName },
          ],
        },
      })

      if (existingContact) {
        finalContactId = existingContact.id
      } else {
        const newContact = await prisma.contact.create({
          data: {
            tenantId: authResult.tenantId,
            name: contactName,
            email: contactEmail || null,
            phone: contactPhone || null,
            type: 'lead',
            stage: 'prospect',
          },
        })
        finalContactId = newContact.id
      }
    }

    const deal = await prisma.deal.create({
      data: {
        tenantId: authResult.tenantId,
        name: String(name),
        value: value ? Number(value) : 0,
        stage: stage as any,
        probability: probability ? Number(probability) : undefined,
        contactId: finalContactId || null,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      },
    })

    return NextResponse.json({ data: deal }, { status: 201 })
  } catch (error) {
    console.error('[API] v1/deals POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create deal' },
      { status: 500 }
    )
  }
}

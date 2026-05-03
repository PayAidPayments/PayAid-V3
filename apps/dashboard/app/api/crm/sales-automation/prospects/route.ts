import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/sales-automation/prospects — high-intent CRM contacts (queue candidates)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const prospects = await prisma.contact.findMany({
      where: {
        tenantId,
        stage: 'prospect',
        leadScore: { gte: 50 },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        source: true,
        leadScore: true,
        lastContactedAt: true,
        nextFollowUp: true,
        createdAt: true,
      },
      orderBy: {
        leadScore: 'desc',
      },
      take: 100,
    })

    const ids = prospects.map((c) => c.id)
    const interactionGroups =
      ids.length > 0
        ? await prisma.interaction.groupBy({
            by: ['contactId'],
            where: { contactId: { in: ids } },
            _count: { _all: true },
          })
        : []
    const interactionCountByContact = new Map(
      interactionGroups.map((g) => [g.contactId, g._count._all])
    )

    const aiProspects = prospects.map((contact) => {
      const status = contact.lastContactedAt
        ? ('contacted' as const)
        : (contact.leadScore || 0) >= 70
          ? ('qualified' as const)
          : ('pending' as const)
      return {
      id: contact.id,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || undefined,
      company: contact.company || undefined,
      status,
      intentScore: contact.leadScore || 0,
      lastContacted: contact.lastContactedAt?.toISOString(),
      nextFollowUp: contact.nextFollowUp?.toISOString(),
      contactCount: interactionCountByContact.get(contact.id) ?? 0,
      source: contact.source || 'unknown',
    }
    })

    return NextResponse.json({ prospects: aiProspects })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get prospects error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch prospects', message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'

// GET /api/crm/dialer/session - Get active dialer session
export async function GET(request: NextRequest) {
  try {
    const { tenantId: jwtTenantId, userId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const limitRaw = Number.parseInt(request.nextUrl.searchParams.get('limit') || '30', 10)
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 100)) : 30
    const requestedContactId = request.nextUrl.searchParams.get('contactId') || ''

    const contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        phone: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        company: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    })

    const normalizedContacts = contacts
      .filter((contact) => typeof contact.phone === 'string' && contact.phone.trim().length > 0)
      .map((contact) => ({
        id: contact.id,
        name: contact.name || 'Unnamed contact',
        phone: contact.phone as string,
        email: contact.email || undefined,
        company: contact.company || undefined,
        status: 'pending' as const,
      }))

    if (normalizedContacts.length === 0) {
      return NextResponse.json({
        session: null,
        note: 'No contacts with phone numbers are available for this tenant.',
      })
    }

    const preferredIndex = requestedContactId
      ? normalizedContacts.findIndex((contact) => contact.id === requestedContactId)
      : 0
    const currentIndex = preferredIndex >= 0 ? preferredIndex : 0

    const session = {
      id: `session-${tenantId}-${Date.now()}`,
      name: 'Dialer Session',
      contactList: normalizedContacts,
      currentIndex,
      stats: {
        total: normalizedContacts.length,
        completed: 0,
        answered: 0,
        voicemail: 0,
        busy: 0,
        noAnswer: 0,
      },
    }

    return NextResponse.json({
      session,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get dialer session error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session', message: error?.message },
      { status: 500 }
    )
  }
}

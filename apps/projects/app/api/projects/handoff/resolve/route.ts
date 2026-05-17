import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/projects/handoff/resolve?dealId=&contactId=
 * Prefill labels for CRM deep links.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')
    const { searchParams } = request.nextUrl
    const dealId = searchParams.get('dealId')?.trim()
    const contactId = searchParams.get('contactId')?.trim()

    let resolvedContactId = contactId || null
    let contact: { id: string; name: string; email: string | null } | null = null
    let deal: {
      id: string
      name: string
      stage: string
      value: number
      contactId: string | null
    } | null = null

    if (dealId) {
      const row = await prisma.deal.findFirst({
        where: { id: dealId, tenantId },
        select: {
          id: true,
          name: true,
          stage: true,
          value: true,
          contactId: true,
          contact: { select: { id: true, name: true, email: true } },
        },
      })
      if (!row) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }
      deal = {
        id: row.id,
        name: row.name,
        stage: row.stage,
        value: row.value,
        contactId: row.contactId,
      }
      if (row.contact) {
        contact = row.contact
        resolvedContactId = row.contact.id
      } else if (row.contactId && !contact) {
        resolvedContactId = row.contactId
      }
    }

    if (resolvedContactId && !contact) {
      const row = await prisma.contact.findFirst({
        where: { id: resolvedContactId, tenantId },
        select: { id: true, name: true, email: true },
      })
      if (!row) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
      contact = row
    }

    return NextResponse.json({
      contact,
      deal,
      resolvedContactId,
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error as { moduleId: string })
    }
    console.error('Handoff resolve error:', error)
    return NextResponse.json({ error: 'Failed to resolve handoff' }, { status: 500 })
  }
}

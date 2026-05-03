import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const enrichSchema = z.object({
  contactId: z.string().min(1, 'contactId is required'),
  tenantId: z.string().optional(),
})

async function enrichLeadData(email: string, domain: string) {
  return {
    email,
    phone: null as string | null,
    company: domain ? domain.split('.')[0] : null,
    companyDomain: domain,
    companySize: null,
    industry: null,
    location: null,
    linkedinUrl: null,
    twitterUrl: null,
    enriched: false,
  }
}

/**
 * POST /api/crm/contacts/enrich
 * Enrich a single contact (used from prospect/contact detail page).
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = enrichSchema.parse(body)
    const contactId = validated.contactId

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { id: true, email: true, phone: true, company: true },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const email = contact.email || ''
    const domain = email.split('@')[1] || contact.company || ''
    const enrichedData = await enrichLeadData(email, domain)

    const updateData: Record<string, unknown> = {}
    if (enrichedData.phone && !contact.phone) updateData.phone = enrichedData.phone
    if (enrichedData.company && !contact.company) updateData.company = enrichedData.company

    if (Object.keys(updateData).length > 0) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Contact enrichment completed',
      enriched: enrichedData.enriched,
      data: enrichedData,
      note: 'Enrichment uses available data. Integrate Apollo, Clearbit, or ZoomInfo for full enrichment.',
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error as { moduleId: string })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Contact enrich error:', error)
    return NextResponse.json(
      { error: 'Failed to enrich contact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

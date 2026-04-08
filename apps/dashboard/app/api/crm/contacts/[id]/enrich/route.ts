import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

/**
 * POST /api/crm/contacts/[id]/enrich
 * Enrich contact data from public sources
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:contact:enrich:${id}:${idempotencyKey}`)
      const existingEnriched = (existing?.afterSnapshot as { enriched?: boolean } | null)?.enriched
      if (existing && existingEnriched) {
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 })
      }
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: id,
        tenantId,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Mock enrichment data (in production, integrate with enrichment APIs like Clearbit, FullContact, etc.)
    const enrichmentData = {
      socialProfiles: {
        linkedin: contact.company ? `https://linkedin.com/company/${contact.company.toLowerCase().replace(/\s+/g, '-')}` : undefined,
      },
      companyInfo: {
        website: contact.company ? `https://${contact.company.toLowerCase().replace(/\s+/g, '')}.com` : undefined,
        industry: 'Technology',
        employees: Math.floor(Math.random() * 1000) + 50,
        revenue: '₹10M - ₹50M',
      },
      verified: {
        email: contact.email ? contact.email.includes('@') : false,
        phone: contact.phone ? contact.phone.length > 10 : false,
        company: !!contact.company,
      },
    }

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:contact:enrich:${id}:${idempotencyKey}`, {
        contact_id: id,
        enriched: true,
      })
    }

    return NextResponse.json(enrichmentData)
  } catch (error: any) {
    console.error('Contact enrichment error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to enrich contact' },
      { status: 500 }
    )
  }
}

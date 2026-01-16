import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const enrichSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead must be selected'),
  provider: z.enum(['apollo', 'clearbit', 'zoominfo']).optional().default('clearbit'),
})

// Helper function to enrich lead data from external APIs
async function enrichLeadData(email: string, domain: string, provider: string) {
  // For now, return mock data structure
  // In production, integrate with actual APIs:
  // - Apollo.io API
  // - Clearbit Enrichment API
  // - ZoomInfo API
  
  // Mock enrichment data structure
  return {
    email: email,
    phone: null,
    company: domain ? domain.split('.')[0] : null,
    companyDomain: domain,
    companySize: null,
    industry: null,
    location: null,
    linkedinUrl: null,
    twitterUrl: null,
    enriched: false, // Set to true when real API is integrated
  }
}

// POST /api/crm/leads/enrich - Enrich leads with external data
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = enrichSchema.parse(body)

    // Get leads to enrich
    const leads = await prisma.contact.findMany({
      where: {
        id: { in: validated.leadIds },
        tenantId,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        company: true,
      },
    })

    if (leads.length !== validated.leadIds.length) {
      return NextResponse.json(
        { error: 'Some leads were not found or do not belong to this tenant' },
        { status: 400 }
      )
    }

    // Enrich each lead
    const enrichmentResults = await Promise.all(
      leads.map(async (lead) => {
        const email = lead.email || ''
        const domain = email.split('@')[1] || lead.company || ''
        
        try {
          const enrichedData = await enrichLeadData(email, domain, validated.provider)
          
          // Update lead with enriched data (only if we have new data)
          const updateData: any = {}
          if (enrichedData.phone && !lead.phone) updateData.phone = enrichedData.phone
          if (enrichedData.company && !lead.company) updateData.company = enrichedData.company
          
          if (Object.keys(updateData).length > 0) {
            await prisma.contact.update({
              where: { id: lead.id },
              data: updateData,
            })
          }
          
          return {
            leadId: lead.id,
            enriched: enrichedData.enriched,
            data: enrichedData,
          }
        } catch (error) {
          console.error(`Error enriching lead ${lead.id}:`, error)
          return {
            leadId: lead.id,
            enriched: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    const enrichedCount = enrichmentResults.filter(r => r.enriched).length

    return NextResponse.json({
      success: true,
      message: `Enriched ${enrichedCount} of ${leads.length} lead(s)`,
      enriched: enrichedCount,
      total: leads.length,
      results: enrichmentResults,
      note: 'Lead enrichment is currently using mock data. Integrate with Apollo.io, Clearbit, or ZoomInfo APIs for real enrichment.',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Lead enrichment error:', error)
    return NextResponse.json(
      { error: 'Failed to enrich leads', message: error?.message },
      { status: 500 }
    )
  }
}

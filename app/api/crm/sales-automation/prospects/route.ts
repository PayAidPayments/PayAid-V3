import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/sales-automation/prospects - Get AI-prospected leads
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get high-intent prospects from contacts
    // In production, this would use AI to identify and score prospects
    const prospects = await prisma.contact.findMany({
      where: {
        tenantId,
        stage: 'prospect',
        leadScore: { gte: 50 }, // High-intent prospects
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

    // Transform to AI prospect format
    const aiProspects = prospects.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || undefined,
      company: contact.company || undefined,
      status: contact.lastContactedAt ? 'contacted' : 'pending' as const,
      intentScore: contact.leadScore || 0,
      lastContacted: contact.lastContactedAt?.toISOString(),
      nextFollowUp: contact.nextFollowUp?.toISOString(),
      contactCount: 0, // Can be calculated from interactions
      source: contact.source || 'unknown',
    }))

    return NextResponse.json({ prospects: aiProspects })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get prospects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prospects', message: error?.message },
      { status: 500 }
    )
  }
}

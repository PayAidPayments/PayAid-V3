/**
 * Predictive Insights API
 * GET /api/crm/leads/[id]/insights - Get predictive insights for a lead
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getPredictiveInsights } from '@/lib/ai/lead-scoring/predictive-insights'
import { prisma } from '@/lib/db/prisma'

// GET /api/crm/leads/[id]/insights - Get predictive insights
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const resolvedParams = await params
    const contactId = resolvedParams.id

    // Get contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Get predictive insights
    const prediction = await getPredictiveInsights(contact, tenantId)

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      contactName: contact.name,
      prediction,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Predictive insights error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get insights',
      },
      { status: 500 }
    )
  }
}

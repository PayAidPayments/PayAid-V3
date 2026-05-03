/**
 * Customer Insights API Route
 * GET /api/crm/contacts/[id]/insights - Get customer insights
 * POST /api/crm/contacts/[id]/insights/refresh - Refresh insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'
import {
  generateCustomerInsights,
  saveCustomerInsights,
} from '@/lib/ai/customer-insights'

/** GET /api/crm/contacts/[id]/insights - Get customer insights */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Get existing insights or generate new ones
    let insights = await prisma.customerInsight.findUnique({
      where: {
        contactId_tenantId: {
          contactId: id,
          tenantId,
        },
      },
    })

    // If no insights exist or they're older than 24 hours, generate new ones
    if (
      !insights ||
      (insights.lastCalculatedAt &&
        Date.now() - insights.lastCalculatedAt.getTime() > 24 * 60 * 60 * 1000)
    ) {
      const generatedInsights = await generateCustomerInsights(id, tenantId)
      await saveCustomerInsights(id, tenantId, generatedInsights)

      insights = await prisma.customerInsight.findUnique({
        where: {
          contactId_tenantId: {
            contactId: id,
            tenantId,
          },
        },
      })
    }

    if (!insights) {
      return NextResponse.json(
        { error: 'Failed to generate insights' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      insights,
    })
  } catch (error: any) {
    console.error('Get customer insights error:', error)
    return NextResponse.json(
      { error: 'Failed to get customer insights', message: error.message },
      { status: 500 }
    )
  }
}

/** POST /api/crm/contacts/[id]/insights/refresh - Refresh insights */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Generate fresh insights
    const insights = await generateCustomerInsights(id, tenantId)
    await saveCustomerInsights(id, tenantId, insights)

    // Return updated insights
    const updatedInsights = await prisma.customerInsight.findUnique({
      where: {
        contactId_tenantId: {
          contactId: id,
          tenantId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Insights refreshed successfully',
      insights: updatedInsights,
    })
  } catch (error: any) {
    console.error('Refresh customer insights error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh insights', message: error.message },
      { status: 500 }
    )
  }
}

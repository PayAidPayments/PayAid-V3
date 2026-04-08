/**
 * Customer Insights API Route
 * GET /api/crm/contacts/[id]/insights - Get customer insights
 * POST /api/crm/contacts/[id]/insights/refresh - Refresh insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import {
  generateCustomerInsights,
  saveCustomerInsights,
} from '@/lib/ai/customer-insights'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

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
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:contact:insights_refresh:${id}:${idempotencyKey}`)
      const existingRefreshed = (existing?.afterSnapshot as { refreshed?: boolean } | null)?.refreshed
      if (existing && existingRefreshed) {
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 })
      }
    }

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

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:contact:insights_refresh:${id}:${idempotencyKey}`, {
        contact_id: id,
        refreshed: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Insights refreshed successfully',
      insights: updatedInsights,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Refresh customer insights error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh insights', message: error.message },
      { status: 500 }
    )
  }
}

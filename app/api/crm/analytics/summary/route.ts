/**
 * CRM Analytics Summary API Route
 * GET /api/crm/analytics/summary - Get CRM dashboard metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse } from '@/types/base-modules'
import { formatINR } from '@/lib/currency'

/**
 * Get CRM analytics summary
 * GET /api/crm/analytics/summary?organizationId=xxx
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  // Get all metrics in parallel
  const [
    totalContacts,
    activeContacts,
    totalLeads,
    totalCustomers,
    totalDeals,
    activeDeals,
    pipelineValue,
    wonDealsValue,
    contactsByType,
    dealsByStage,
  ] = await Promise.all([
    // Total contacts
    prisma.contact.count({
      where: { tenantId: organizationId },
    }),
    // Active contacts
    prisma.contact.count({
      where: {
        tenantId: organizationId,
        status: 'active',
      },
    }),
    // Total leads
    prisma.contact.count({
      where: {
        tenantId: organizationId,
        contactType: 'lead',
      },
    }),
    // Total customers
    prisma.contact.count({
      where: {
        tenantId: organizationId,
        contactType: 'customer',
      },
    }),
    // Total deals
    prisma.deal.count({
      where: { tenantId: organizationId },
    }),
    // Active deals (not won/lost)
    prisma.deal.count({
      where: {
        tenantId: organizationId,
        stage: {
          notIn: ['won', 'lost'],
        },
      },
    }),
    // Pipeline value (active deals)
    prisma.deal.aggregate({
      where: {
        tenantId: organizationId,
        stage: {
          notIn: ['won', 'lost'],
        },
      },
      _sum: {
        value: true,
      },
    }),
    // Won deals value
    prisma.deal.aggregate({
      where: {
        tenantId: organizationId,
        stage: 'won',
      },
      _sum: {
        value: true,
      },
    }),
    // Contacts by type
    prisma.contact.groupBy({
      by: ['contactType'],
      where: { tenantId: organizationId },
      _count: true,
    }),
    // Deals by stage
    prisma.deal.groupBy({
      by: ['stage'],
      where: { tenantId: organizationId },
      _sum: {
        value: true,
      },
      _count: true,
    }),
  ])

  const summary = {
    contacts: {
      total: totalContacts,
      active: activeContacts,
      leads: totalLeads,
      customers: totalCustomers,
      byType: contactsByType.map((item) => ({
        type: item.contactType,
        count: item._count,
      })),
    },
    deals: {
      total: totalDeals,
      active: activeDeals,
      pipelineValue: Number(pipelineValue._sum.value || 0),
      pipelineValueFormatted: formatINR(Number(pipelineValue._sum.value || 0)),
      wonValue: Number(wonDealsValue._sum.value || 0),
      wonValueFormatted: formatINR(Number(wonDealsValue._sum.value || 0)),
      byStage: dealsByStage.map((item) => ({
        stage: item.stage,
        count: item._count,
        value: Number(item._sum.value || 0),
        valueFormatted: formatINR(Number(item._sum.value || 0)),
      })),
    },
  }

  const response: ApiResponse<typeof summary> = {
    success: true,
    statusCode: 200,
    data: summary,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})

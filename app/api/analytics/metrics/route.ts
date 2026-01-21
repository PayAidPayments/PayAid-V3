/**
 * Analytics Metrics API Route
 * GET /api/analytics/metrics - Get real-time metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse } from '@/types/base-modules'
import { formatINR } from '@/lib/currency'

/**
 * Get real-time metrics
 * GET /api/analytics/metrics?organizationId=xxx&module=crm
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const module = searchParams.get('module')

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

  // Get metrics based on module
  let metrics: Record<string, unknown> = {}

  if (!module || module === 'crm') {
    const [totalContacts, activeDeals, pipelineValue] = await Promise.all([
      prisma.contact.count({ where: { tenantId: organizationId } }),
      prisma.deal.count({
        where: {
          tenantId: organizationId,
          stage: { notIn: ['won', 'lost'] },
        },
      }),
      prisma.deal.aggregate({
        where: {
          tenantId: organizationId,
          stage: { notIn: ['won', 'lost'] },
        },
        _sum: { value: true },
      }),
    ])

    metrics = {
      totalContacts,
      activeDeals,
      pipelineValue: Number(pipelineValue._sum.value || 0),
      pipelineValueFormatted: formatINR(Number(pipelineValue._sum.value || 0)),
    }
  }

  if (!module || module === 'finance') {
    const [totalInvoices, totalRevenue, pendingAmount] = await Promise.all([
      prisma.invoice.count({ where: { tenantId: organizationId } }),
      prisma.invoice.aggregate({
        where: {
          tenantId: organizationId,
          status: 'paid',
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId: organizationId,
          status: { in: ['sent', 'viewed', 'partially_paid'] },
        },
        _sum: { total: true },
      }),
    ])

    metrics = {
      ...metrics,
      totalInvoices,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      totalRevenueFormatted: formatINR(Number(totalRevenue._sum.total || 0)),
      pendingAmount: Number(pendingAmount._sum.total || 0),
      pendingAmountFormatted: formatINR(Number(pendingAmount._sum.total || 0)),
    }
  }

  const response: ApiResponse<Record<string, unknown>> = {
    success: true,
    statusCode: 200,
    data: metrics,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})

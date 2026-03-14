/**
 * Natural Language Query API
 * Handles natural language business intelligence queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { parseNLQuery, executeNLQuery, formatAnalyticsResponse } from '@/lib/ai/nl-query-parser'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const querySchema = z.object({
  query: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = querySchema.parse(body)

    // Parse the NL query
    const parsed = parseNLQuery(validated.query)

    // If it's a general query, let the cofounder handle it
    if (parsed.type === 'general') {
      return NextResponse.json({
        type: 'general',
        message: 'This query will be handled by the AI Co-Founder.',
        redirectTo: '/api/ai/cofounder',
      })
    }

    // Execute the query based on type
    let data: any = null
    let formattedResponse = ''

    if (parsed.type === 'analytics') {
      // Handle analytics queries
      if (parsed.endpoint?.includes('customers')) {
        // Get customer analytics
        const customers = await prisma.contact.findMany({
          where: { tenantId, type: 'customer' },
          include: {
            orders: {
              select: { total: true },
            },
          },
          take: 100,
        })

        // Calculate segments
        const totalRevenue = customers.reduce(
          (sum, c) => sum + c.orders.reduce((s, o) => s + o.total, 0),
          0
        )
        const avgRevenue = totalRevenue / customers.length || 0

        const segments = {
          vip: customers.filter((c) => {
            const revenue = c.orders.reduce((s, o) => s + o.total, 0)
            return revenue >= avgRevenue * 2
          }).length,
          regular: customers.filter((c) => {
            const revenue = c.orders.reduce((s, o) => s + o.total, 0)
            return revenue >= avgRevenue && revenue < avgRevenue * 2
          }).length,
          occasional: customers.filter((c) => {
            const revenue = c.orders.reduce((s, o) => s + o.total, 0)
            return revenue < avgRevenue && revenue > 0
          }).length,
          inactive: customers.filter((c) => c.orders.length === 0).length,
        }

        const topCustomers = customers
          .map((c) => ({
            name: c.name,
            ltv: c.orders.reduce((s, o) => s + o.total, 0),
            orderCount: c.orders.length,
          }))
          .sort((a, b) => b.ltv - a.ltv)
          .slice(0, parsed.params?.limit || 10)

        data = {
          segments,
          topCustomersByLTV: topCustomers,
          totalCustomers: customers.length,
        }

        formattedResponse = formatAnalyticsResponse(data, validated.query)
      } else if (parsed.endpoint?.includes('insights')) {
        // Redirect to insights endpoint
        const insightsResponse = await fetch(`${request.nextUrl.origin}/api/ai/insights`, {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        })
        const insights = await insightsResponse.json()
        data = insights
        formattedResponse = `Here are your growth opportunities:\n${insights.insights?.opportunities?.slice(0, 3).join('\n') || 'No specific opportunities identified.'}`
      }
    } else if (parsed.type === 'data') {
      // Handle data queries
      if (parsed.endpoint?.includes('invoices')) {
        const invoices = await prisma.invoice.findMany({
          where: {
            tenantId,
            status: parsed.params?.status || 'sent',
            paidAt: null,
          },
          include: { customer: { select: { name: true } } },
          take: 10,
        })
        data = invoices
        formattedResponse = `You have ${invoices.length} pending invoices totaling ₹${invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString('en-IN')}`
      } else if (parsed.endpoint?.includes('deals')) {
        const deals = await prisma.deal.findMany({
          where: {
            tenantId,
            stage: { not: 'lost' },
          },
          include: { contact: { select: { name: true } } },
          take: 10,
        })
        data = deals
        formattedResponse = `You have ${deals.length} active deals worth ₹${deals.reduce((sum, d) => sum + d.value, 0).toLocaleString('en-IN')}`
      } else if (parsed.endpoint?.includes('tasks')) {
        const tasks = await prisma.task.findMany({
          where: {
            tenantId,
            status: parsed.params?.status || 'pending',
          },
          take: 10,
        })
        data = tasks
        formattedResponse = `You have ${tasks.length} pending tasks. ${tasks.filter((t) => t.priority === 'high').length} are high priority.`
      }
    }

    return NextResponse.json({
      type: parsed.type,
      query: validated.query,
      data,
      formattedResponse: formattedResponse || parsed.formattedResponse,
      endpoint: parsed.endpoint,
      params: parsed.params,
    })
  } catch (error) {
    console.error('[NL_QUERY] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to process NL query',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

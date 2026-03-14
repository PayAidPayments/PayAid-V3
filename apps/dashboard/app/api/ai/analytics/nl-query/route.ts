/**
 * Natural Language Analytics Query API
 * Converts natural language questions into analytics queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** POST /api/ai/analytics/nl-query - Answer natural language analytics questions */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    const q = query.toLowerCase()

    // Parse query and generate response
    let answer = ''
    let data: any = null
    let chartType: 'bar' | 'line' | 'pie' | 'table' | null = null

    if (q.includes('revenue') || q.includes('sales') || q.includes('income')) {
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: 'sent',
        },
        select: {
          total: true,
          invoiceDate: true,
        },
      })

      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      const monthlyRevenue = invoices
        .filter((inv) => {
          const date = new Date(inv.invoiceDate || new Date())
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        })
        .reduce((sum, inv) => sum + Number(inv.total || 0), 0)

      answer = `Your total revenue is ₹${totalRevenue.toLocaleString('en-IN')}. This month's revenue is ₹${monthlyRevenue.toLocaleString('en-IN')}.`
      data = {
        total: totalRevenue,
        thisMonth: monthlyRevenue,
        trend: 'up', // Simplified
      }
      chartType = 'bar'
    } else if (q.includes('contact') || q.includes('lead') || q.includes('customer')) {
      const contactCount = await prisma.contact.count({
        where: { tenantId },
      })
      const leadCount = await prisma.contact.count({
        where: { tenantId, type: 'lead' },
      })
      const customerCount = await prisma.contact.count({
        where: { tenantId, type: 'customer' },
      })

      answer = `You have ${contactCount} total contacts: ${leadCount} leads and ${customerCount} customers.`
      data = {
        total: contactCount,
        leads: leadCount,
        customers: customerCount,
      }
      chartType = 'pie'
    } else if (q.includes('deal') || q.includes('pipeline')) {
      const deals = await prisma.deal.findMany({
        where: { tenantId },
        select: {
          stage: true,
          value: true,
        },
      })

      const pipelineValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0)
      const byStage = deals.reduce((acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + Number(deal.value || 0)
        return acc
      }, {} as Record<string, number>)

      answer = `Your pipeline value is ₹${pipelineValue.toLocaleString('en-IN')}.`
      data = {
        total: pipelineValue,
        byStage,
      }
      chartType = 'bar'
    } else if (q.includes('invoice') && (q.includes('overdue') || q.includes('pending'))) {
      const overdue = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: 'sent',
          dueDate: { lt: new Date() },
          paymentStatus: { not: 'paid' },
        },
        select: {
          invoiceNumber: true,
          total: true,
          dueDate: true,
          customerName: true,
        },
      })

      const overdueTotal = overdue.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      answer = `You have ${overdue.length} overdue invoices totaling ₹${overdueTotal.toLocaleString('en-IN')}.`
      data = {
        count: overdue.length,
        total: overdueTotal,
        invoices: overdue,
      }
      chartType = 'table'
    } else {
      answer = "I can help you analyze revenue, contacts, deals, invoices, and more. Try asking: 'What's my revenue?', 'How many contacts do I have?', or 'Show me overdue invoices'."
    }

    return NextResponse.json({
      answer,
      data,
      chartType,
      query,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to process query' },
      { status: 500 }
    )
  }
}

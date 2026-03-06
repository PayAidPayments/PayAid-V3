import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

/**
 * GET /api/home/summary?tenantId=
 * Cross-module KPI counts for Command Center.
 * Requires Bearer token; tenantId must match JWT tenant (or super_admin).
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl
    const queryTenantId = url.searchParams.get('tenantId')?.trim()
    const tenantId = queryTenantId && payload.tenantId === queryTenantId ? queryTenantId : payload.tenantId

    const [dealsCount, contactsCount, tasksCount, invoicesCount, employeesCount, productsCount, openDealsValue, pendingInvoicesTotal, overdueInvoicesCount, pendingInvoicesCount] = await Promise.all([
      prisma.deal.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId, status: { not: 'completed' } } }),
      prisma.invoice.count({ where: { tenantId } }),
      prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.deal.aggregate({
        where: { tenantId, stage: { notIn: ['won', 'lost'] } },
        _sum: { value: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['sent', 'issued'] } },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['sent', 'issued'] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.invoice.count({
        where: { tenantId, status: { in: ['sent', 'issued'] } },
      }),
    ])

    const openDeals = await prisma.deal.count({
      where: { tenantId, stage: { notIn: ['won', 'lost'] } },
    })

    const openDealsValueNum = openDealsValue._sum.value ?? 0
    const pendingTotal = pendingInvoicesTotal._sum.total ?? 0
    const valueLakhs = (openDealsValueNum / 1_00_000).toFixed(1)
    const pendingLakhs = (pendingTotal / 1_00_000).toFixed(1)

    // Per-module one-liners for Pinned & Recent row on Apps Home
    const moduleSummaries: Record<string, string> = {
      crm: `${openDeals} open deals · ₹${valueLakhs} L pipeline`,
      finance: `₹${pendingLakhs} L receivables · ${overdueInvoicesCount} overdue`,
      hr: `${employeesCount} employees · ${overdueTasks} tasks pending`,
      marketing: `${contactsCount} contacts`,
      sales: `${openDeals} open deals`,
      projects: `${overdueTasks} tasks open`,
      inventory: `${productsCount} products`,
      analytics: `${openDeals} deals · ₹${valueLakhs} L pipeline`,
    }

    return NextResponse.json({
      tenantId,
      kpis: {
        openDeals,
        openDealsValue: openDealsValueNum,
        contacts: contactsCount,
        activeEmployees: employeesCount,
        pendingInvoices: pendingInvoicesCount,
        pendingInvoicesTotal: pendingTotal,
        overdueInvoices: overdueInvoicesCount,
        overdueTasks: tasksCount,
        products: productsCount,
      },
      moduleSummaries,
      // For AI Daily Briefing: pass raw counts; agent can summarize
      _counts: {
        deals: dealsCount,
        contacts: contactsCount,
        tasks: tasksCount,
        invoices: invoicesCount,
        employees: employeesCount,
        products: productsCount,
      },
    })
  } catch (e) {
    console.error('[HOME_SUMMARY]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load summary' },
      { status: 500 }
    )
  }
}

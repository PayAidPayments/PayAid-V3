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
    const authTenantId = payload?.tenantId ?? (payload as { tenant_id?: string })?.tenant_id
    if (!authTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl
    const queryTenantId = url.searchParams.get('tenantId')?.trim()
    let tenantId = queryTenantId && authTenantId === queryTenantId ? queryTenantId : authTenantId
    // If query param looks like a slug (not a CUID), resolve to tenant id (only allow if it's the auth tenant)
    if (queryTenantId && queryTenantId !== authTenantId && queryTenantId.length < 30) {
      const bySlug = await prisma.tenant.findFirst({
        where: { slug: queryTenantId },
        select: { id: true },
      })
      if (bySlug && bySlug.id === authTenantId) tenantId = bySlug.id
    }

    let dealsCount: number
    let contactsCount: number
    let tasksCount: number
    let invoicesCount: number
    let employeesCount: number
    let productsCount: number
    let openDeals: number
    let openDealsValue: { _sum: { value: number | null } }
    let pendingInvoicesTotal: { _sum: { total: number | null } }
    let overdueInvoicesCount: number
    let pendingInvoicesCount: number

    try {
      ;[
        dealsCount,
        contactsCount,
        tasksCount,
        invoicesCount,
        employeesCount,
        productsCount,
        openDeals,
        openDealsValue,
        pendingInvoicesTotal,
        overdueInvoicesCount,
        pendingInvoicesCount,
      ] = await Promise.all([
        prisma.deal.count({ where: { tenantId } }),
        prisma.contact.count({ where: { tenantId } }),
        prisma.task.count({ where: { tenantId, status: { not: 'completed' } } }),
        prisma.invoice.count({ where: { tenantId } }),
        prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } }),
        prisma.product.count({ where: { tenantId } }),
        prisma.deal.count({
          where: { tenantId, stage: { notIn: ['won', 'lost'] } },
        }),
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
    } catch (dbErr) {
      console.error('[HOME_SUMMARY] Database error:', dbErr)
      const zeros = {
        openDeals: 0,
        openDealsValue: 0,
        contacts: 0,
        activeEmployees: 0,
        pendingInvoices: 0,
        pendingInvoicesTotal: 0,
        overdueInvoices: 0,
        overdueTasks: 0,
        products: 0,
      }
      return NextResponse.json({
        tenantId,
        kpis: zeros,
        moduleSummaries: {},
        degraded: true,
      })
    }

    const openDealsValueNum = openDealsValue._sum.value ?? 0
    const pendingTotal = pendingInvoicesTotal._sum.total ?? 0
    const valueLakhs = (openDealsValueNum / 1_00_000).toFixed(1)
    const pendingLakhs = (pendingTotal / 1_00_000).toFixed(1)

    // Per-module one-liners for Pinned & Recent row on Apps Home
    const moduleSummaries: Record<string, string> = {
      crm: `${openDeals} open deals · ₹${valueLakhs} L pipeline`,
      finance: `₹${pendingLakhs} L receivables · ${overdueInvoicesCount} overdue`,
      hr: `${employeesCount} employees · ${tasksCount} tasks pending`,
      marketing: `${contactsCount} contacts`,
      sales: `${openDeals} open deals`,
      projects: `${tasksCount} tasks open`,
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

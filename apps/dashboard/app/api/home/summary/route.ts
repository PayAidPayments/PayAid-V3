import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { createServerTiming, withCachedJson } from '@/lib/performance/api-server-timing'

/**
 * GET /api/home/summary?tenantId=
 * Cross-module KPI counts for Command Center.
 * Requires Bearer token; tenantId must match JWT tenant (or super_admin).
 *
 * Each metric is queried independently so one failing table cannot zero the whole overview.
 */
async function safeCount(
  label: string,
  fn: () => Promise<number>
): Promise<number> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[HOME_SUMMARY] ${label} failed:`, err)
    return 0
  }
}

async function safeAggregateSum(
  label: string,
  fn: () => Promise<{ _sum: { value?: number | null; total?: number | null } }>
): Promise<number> {
  try {
    const result = await fn()
    return result._sum.value ?? result._sum.total ?? 0
  } catch (err) {
    console.error(`[HOME_SUMMARY] ${label} failed:`, err)
    return 0
  }
}

export async function GET(request: NextRequest) {
  const timing = createServerTiming()
  
  try {
    timing.start('auth')
    const payload = await authenticateRequest(request)
    timing.end('auth')
    
    const authTenantId = payload?.tenantId ?? (payload as { tenant_id?: string })?.tenant_id
    if (!authTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl
    const queryTenantId = url.searchParams.get('tenantId')?.trim()
    let tenantId = queryTenantId && authTenantId === queryTenantId ? queryTenantId : authTenantId
    // If query param looks like a slug (not a CUID), resolve to tenant id (only allow if it's the auth tenant)
    if (queryTenantId && queryTenantId !== authTenantId && queryTenantId.length < 30) {
      try {
        const bySlug = await prisma.tenant.findFirst({
          where: {
            OR: [{ slug: queryTenantId }, { subdomain: queryTenantId }],
          },
          select: { id: true },
        })
        if (bySlug && bySlug.id === authTenantId) tenantId = bySlug.id
      } catch (err) {
        console.error('[HOME_SUMMARY] tenant slug resolve failed:', err)
      }
    }

    const cacheKey = `home:summary:${tenantId}`
    
    const summary = await withCachedJson(cacheKey, 30, async () => {
      timing.start('db')
      
    const [
      dealsCount,
      contactsCount,
      tasksCount,
      invoicesCount,
      employeesCount,
      productsCount,
      openDeals,
      openDealsValueNum,
      pendingTotal,
      overdueInvoicesCount,
      pendingInvoicesCount,
    ] = await Promise.all([
      safeCount('deals', () => prisma.deal.count({ where: { tenantId } })),
      safeCount('contacts', () => prisma.contact.count({ where: { tenantId } })),
      safeCount('tasks', () =>
        prisma.task.count({ where: { tenantId, status: { not: 'completed' } } })
      ),
      safeCount('invoices', () => prisma.invoice.count({ where: { tenantId } })),
      safeCount('employees', () =>
        prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } })
      ),
      safeCount('products', () => prisma.product.count({ where: { tenantId } })),
      safeCount('openDeals', () =>
        prisma.deal.count({
          where: { tenantId, stage: { notIn: ['won', 'lost'] } },
        })
      ),
      safeAggregateSum('openDealsValue', () =>
        prisma.deal.aggregate({
          where: { tenantId, stage: { notIn: ['won', 'lost'] } },
          _sum: { value: true },
        })
      ),
      safeAggregateSum('pendingInvoicesTotal', () =>
        prisma.invoice.aggregate({
          where: { tenantId, status: { in: ['sent', 'issued'] } },
          _sum: { total: true },
        })
      ),
      safeCount('overdueInvoices', () =>
        prisma.invoice.count({
          where: {
            tenantId,
            status: { in: ['sent', 'issued'] },
            dueDate: { lt: new Date() },
          },
        })
      ),
      safeCount('pendingInvoices', () =>
        prisma.invoice.count({
          where: { tenantId, status: { in: ['sent', 'issued'] } },
        })
      ),
    ])

      timing.end('db')

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

    return {
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
    }
    }, timing)

    return NextResponse.json(summary, {
      headers: {
        'Server-Timing': timing.toHeaders(),
      },
    })
  } catch (e) {
    console.error('[HOME_SUMMARY]', e, timing.toLogMeta())
    
    // Soft-fail: return zeros instead of 500 when possible (keep auth 401)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Failed to load summary',
        degraded: true,
        tenantId: '',
        kpis: {
          openDeals: 0,
          openDealsValue: 0,
          contacts: 0,
          activeEmployees: 0,
          pendingInvoices: 0,
          pendingInvoicesTotal: 0,
          overdueInvoices: 0,
          overdueTasks: 0,
          products: 0,
        },
        moduleSummaries: {},
        _counts: {
          deals: 0,
          contacts: 0,
          tasks: 0,
          invoices: 0,
          employees: 0,
          products: 0,
        },
      },
      { status: 200 }
    )
  }
}

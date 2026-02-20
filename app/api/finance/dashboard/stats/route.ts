import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { verifyToken } from '@/lib/auth/jwt'

// GET /api/finance/dashboard/stats - Get Finance dashboard statistics
// Optional query: ?tenantId=xxx — when user is super_admin, stats for that tenant; otherwise JWT tenant is used.
export async function GET(request: NextRequest) {
  try {
    const { tenantId: jwtTenantId } = await requireModuleAccess(request, 'finance')
    const url = request.nextUrl
    const tenantIdFromQuery = url.searchParams.get('tenantId')

    let tenantId = jwtTenantId
    if (tenantIdFromQuery && tenantIdFromQuery.trim() !== '') {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (token) {
        try {
          const payload = verifyToken(token)
          const isSuperAdmin = payload?.role === 'super_admin' || payload?.roles?.includes('super_admin')
          if (isSuperAdmin) {
            tenantId = tenantIdFromQuery.trim()
          }
        } catch {
          // Keep jwtTenantId
        }
      }
    }

    // Log tenantId for debugging production issues
    console.log('[FINANCE_DASHBOARD] Fetching stats for tenantId:', tenantId)
    
    if (!tenantId) {
      console.error('[FINANCE_DASHBOARD] No tenantId found in request')
      return NextResponse.json(
        { error: 'No tenantId found in request' },
        { status: 400 }
      )
    }

    // Verify tenantId exists in database and test connection
    try {
      const tenantExists = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      })
      
      if (!tenantExists) {
        console.error('[FINANCE_DASHBOARD] Tenant not found in database:', tenantId)
        return NextResponse.json(
          { error: `Tenant ${tenantId} not found in database` },
          { status: 404 }
        )
      }
      
      console.log('[FINANCE_DASHBOARD] Tenant verified:', tenantExists.name)
    } catch (tenantCheckError: any) {
      console.error('[FINANCE_DASHBOARD] Error checking tenant:', tenantCheckError)
      
      // Check if it's a database connection error
      const errorMessage = tenantCheckError?.message || String(tenantCheckError || '')
      const isConnectionError = tenantCheckError?.code?.startsWith('P1') ||
                               errorMessage.toLowerCase().includes('can\'t reach') ||
                               errorMessage.toLowerCase().includes('connect') ||
                               errorMessage.toLowerCase().includes('enotfound') ||
                               errorMessage.toLowerCase().includes('econnrefused')
      
      if (isConnectionError) {
        console.error('[FINANCE_DASHBOARD] Database connection failed during tenant check')
        return NextResponse.json(
          { 
            error: 'Database connection failed',
            message: process.env.VERCEL === '1'
              ? 'Unable to connect to database. Please check your DATABASE_URL configuration in Vercel. If using Supabase, check if your project is paused.'
              : !process.env.DATABASE_URL
                ? 'DATABASE_URL is not set. Please add DATABASE_URL to your .env.local file.'
                : 'Unable to connect to database. Please check your DATABASE_URL in .env.local file. Verify your connection string and ensure Supabase project is active.',
            code: tenantCheckError?.code,
            troubleshooting: {
              steps: [
                '1. Check if DATABASE_URL is set in Vercel environment variables',
                '2. If using Supabase, check if your project is paused: https://supabase.com/dashboard',
                '3. Resume the Supabase project if paused (free tier pauses after inactivity)',
                '4. Wait 1-2 minutes after resuming for the database to activate',
                '5. Verify the database connection string is correct',
              ],
              healthCheck: '/api/health/db',
            },
          },
          { status: 503 }
        )
      }
      
      // Continue anyway for other errors
    }

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch all data in parallel
    const [
      totalInvoices,
      invoicesThisMonth,
      invoicesLastMonth,
      paidInvoices,
      overdueInvoices,
      pendingInvoices,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      totalExpenses,
      expensesThisMonth,
      purchaseOrders,
      purchaseOrdersThisMonth,
      gstReports,
      recentInvoices,
      recentPurchaseOrders,
      overdueAmountAgg,
      vendorsCount,
      vendorsDueAmountAgg,
      creditNotesCount,
      debitNotesCount,
    ] = await Promise.all([
      // Total invoices
      prisma.invoice.count({
        where: { tenantId },
      }).catch((err) => {
        console.error('[FINANCE_DASHBOARD] Error counting total invoices:', err)
        return 0
      }),
      
      // Invoices this month
      prisma.invoice.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }).catch((err) => {
        console.error('[FINANCE_DASHBOARD] Error counting invoices this month:', err)
        return 0
      }),
      
      // Invoices last month
      prisma.invoice.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }).catch(() => 0),
      
      // Paid invoices
      prisma.invoice.count({
        where: {
          tenantId,
          status: 'paid',
        },
      }).catch(() => 0),
      
      // Overdue invoices
      prisma.invoice.count({
        where: {
          tenantId,
          status: 'overdue',
        },
      }).catch(() => 0),
      
      // Pending invoices
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['draft', 'sent'] },
        },
      }).catch(() => 0),
      
      // Total revenue (all paid invoices)
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'paid',
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Revenue this month
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'paid',
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Revenue last month
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'paid',
          paidAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Total expenses (from accounting expenses)
      prisma.expense.aggregate({
        where: {
          tenantId,
          status: { in: ['approved', 'paid'] },
        },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } })),
      
      // Expenses this month
      prisma.expense.aggregate({
        where: {
          tenantId,
          status: { in: ['approved', 'paid'] },
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } })),
      
      // Purchase orders
      prisma.purchaseOrder.count({
        where: { tenantId },
      }).catch(() => 0),
      
      // Purchase orders this month
      prisma.purchaseOrder.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }).catch(() => 0),
      
      // GST reports (count of GST filings)
      prisma.report.count({
        where: { 
          tenantId,
          type: 'gst',
        },
      }).catch(() => 0),
      
      // Recent invoices (last 5)
      prisma.invoice.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }).catch(() => []),
      
      // Recent purchase orders (last 5)
      prisma.purchaseOrder.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          poNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }).catch(() => []),
      // Overdue invoices amount (same definition as overdue count: status = overdue)
      prisma.invoice.aggregate({
        where: { tenantId, status: 'overdue' },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      // Vendors count
      prisma.vendor.count({ where: { tenantId } }).catch(() => 0),
      // POs pending/approved total (amount "due" to vendors)
      prisma.purchaseOrder.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'APPROVED', 'SENT', 'DRAFT'] },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Credit Notes count
      prisma.creditNote.count({
        where: { tenantId },
      }).catch(() => 0),
      
      // Debit Notes count
      prisma.debitNote.count({
        where: { tenantId },
      }).catch(() => 0),
    ])

    // Calculate growth percentages
    const invoiceGrowth = invoicesLastMonth > 0 
      ? ((invoicesThisMonth - invoicesLastMonth) / invoicesLastMonth) * 100 
      : invoicesThisMonth > 0 ? 100 : 0
    
    const revenueThisMonthNum = Number(revenueThisMonth._sum.total || 0)
    const revenueLastMonthNum = Number(revenueLastMonth._sum.total || 0)
    const revenueGrowth = revenueLastMonthNum > 0
      ? ((revenueThisMonthNum - revenueLastMonthNum) / revenueLastMonthNum) * 100
      : revenueThisMonthNum > 0 ? 100 : 0

    // Monthly revenue trend (last 12 months) – same as Revenue Reports
    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyRevenue = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT 
        TO_CHAR("paidAt", 'Mon YYYY') as month,
        COALESCE(SUM("total"), 0)::float as revenue
      FROM "Invoice"
      WHERE "tenantId" = ${tenantId}
        AND "status" = 'paid'
        AND "paidAt" IS NOT NULL
        AND "paidAt" >= ${twelveMonthsAgo}
      GROUP BY TO_CHAR("paidAt", 'Mon YYYY')
      ORDER BY MIN("paidAt") ASC
    `.catch(() => [])

    // AR aging: unpaid invoices by days overdue (0–30, 31–60, 60+)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const d30 = new Date(today); d30.setDate(d30.getDate() - 30)
    const d60 = new Date(today); d60.setDate(d60.getDate() - 60)
    const ar0_30Agg = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ['sent', 'pending', 'overdue'] },
        dueDate: { not: null, gte: d30, lt: today },
      },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } }))
    const ar31_60Agg = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ['sent', 'pending', 'overdue'] },
        dueDate: { not: null, gte: d60, lt: d30 },
      },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } }))
    const ar60PlusAgg = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ['sent', 'pending', 'overdue'] },
        dueDate: { not: null, lt: d60 },
      },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } }))
    const arAging = {
      bucket0_30: Number(ar0_30Agg._sum?.total ?? 0),
      bucket31_60: Number(ar31_60Agg._sum?.total ?? 0),
      bucket60Plus: Number(ar60PlusAgg._sum?.total ?? 0),
    }

    // AP aging: POs by expectedDeliveryDate buckets (due today, next 7d, next 30d)
    const dueTodayEnd = new Date(today); dueTodayEnd.setDate(dueTodayEnd.getDate() + 1)
    const due7dEnd = new Date(today); due7dEnd.setDate(due7dEnd.getDate() + 8)
    const due30dEnd = new Date(today); due30dEnd.setDate(due30dEnd.getDate() + 31)
    const [apDueTodayAgg, apDue7dAgg, apDue30dAgg] = await Promise.all([
      prisma.purchaseOrder.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'APPROVED', 'SENT'] },
          expectedDeliveryDate: { not: null, gte: today, lt: dueTodayEnd },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      prisma.purchaseOrder.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'APPROVED', 'SENT'] },
          expectedDeliveryDate: { not: null, gte: dueTodayEnd, lt: due7dEnd },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      prisma.purchaseOrder.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'APPROVED', 'SENT'] },
          expectedDeliveryDate: { not: null, gte: due7dEnd, lt: due30dEnd },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
    ])
    const apAging = {
      dueToday: Number(apDueTodayAgg._sum?.total ?? 0),
      due7d: Number(apDue7dAgg._sum?.total ?? 0),
      due30d: Number(apDue30dAgg._sum?.total ?? 0),
    }

    // Invoices by status
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
      _sum: { total: true },
    }).catch(() => [])

    // Calculate profit (revenue - expenses)
    const revenueThisMonthValue = Number(revenueThisMonth._sum.total || 0)
    const expensesThisMonthValue = Number(expensesThisMonth._sum.amount || 0)
    const profit = revenueThisMonthValue - expensesThisMonthValue
    const profitMargin = revenueThisMonthValue > 0
      ? (profit / revenueThisMonthValue) * 100
      : 0

    const totalRevenueNum = Number(totalRevenue._sum.total ?? 0)
    const totalExpensesNum = Number(totalExpenses._sum.amount ?? 0)
    const cashPosition = totalRevenueNum - totalExpensesNum
    const monthlyBurn = expensesThisMonthValue > 0 ? expensesThisMonthValue : totalExpensesNum / 12
    const cashRunwayDays = monthlyBurn > 0 && cashPosition > 0
      ? Math.min(365, Math.round((cashPosition / monthlyBurn) * 30))
      : 0

    // GST stubs (India-specific) – derive from invoices where possible
    const gstOutputThisMonth = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: 'paid',
        paidAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { gstAmount: true },
    }).catch(() => ({ _sum: { gstAmount: null } }))
    const gstOutputDueThisMonth = Number(gstOutputThisMonth._sum?.gstAmount ?? 0)
    const gstInputCreditAvailable = gstOutputDueThisMonth * 0.9 // stub: assume 90% input credit available
    const gstReconciliationPct = gstReports > 0 ? 94 : 0 // stub

    const bankRecPct = 98 // stub

    // Log results for debugging
    console.log('[FINANCE_DASHBOARD] Stats fetched successfully:', {
      tenantId,
      totalInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      purchaseOrders,
    })
    
    const overdueAmount = Number(overdueAmountAgg._sum?.total ?? 0)
    const vendorsDueAmount = Number(vendorsDueAmountAgg._sum?.total ?? 0)

    return NextResponse.json({
      totalInvoices,
      invoicesThisMonth,
      invoicesLastMonth,
      invoiceGrowth: Math.round(invoiceGrowth * 10) / 10,
      paidInvoices,
      overdueInvoices,
      overdueAmount,
      pendingInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      revenueThisMonth: revenueThisMonth._sum.total || 0,
      revenueLastMonth: revenueLastMonth._sum.total || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalExpenses: totalExpenses._sum.amount || 0,
      expensesThisMonth: expensesThisMonth._sum.amount || 0,
      profit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      purchaseOrders,
      purchaseOrdersThisMonth,
      gstReports,
      recentInvoices: Array.isArray(recentInvoices) ? recentInvoices : [],
      recentPurchaseOrders: Array.isArray(recentPurchaseOrders) ? recentPurchaseOrders : [],
      monthlyRevenue: Array.isArray(monthlyRevenue)
        ? monthlyRevenue.map((r: any) => ({
            month: r?.month || '',
            revenue: Number(r?.revenue) || 0,
          }))
        : [],
      invoicesByStatus: Array.isArray(invoicesByStatus)
        ? invoicesByStatus.map((i: any) => ({
            status: i?.status || '',
            count: i?._count?.id || 0,
            total: Number(i?._sum?.total) || 0,
          }))
        : [],
      arAging,
      apAging,
      vendorsCount: vendorsCount ?? 0,
      vendorsDueAmount,
      gstInputCreditAvailable,
      gstOutputDueThisMonth: gstOutputDueThisMonth,
      gstReconciliationPct,
      cashPosition,
      cashRunwayDays,
      bankRecPct,
      creditNotesCount: creditNotesCount ?? 0,
      debitNotesCount: debitNotesCount ?? 0,
    })
  } catch (error: any) {
    console.error('[FINANCE_DASHBOARD] Error fetching stats:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
      tenantId: error?.tenantId,
    })
    
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    // Check for database connection errors
    const errorMessage = error?.message || String(error || 'Unknown error')
    const isDatabaseError = error?.code?.startsWith('P1') ||
                           errorMessage.toLowerCase().includes('connect') ||
                           errorMessage.toLowerCase().includes('database') ||
                           errorMessage.toLowerCase().includes('prisma') ||
                           errorMessage.toLowerCase().includes('enotfound') ||
                           errorMessage.toLowerCase().includes('econnrefused') ||
                           errorMessage.toLowerCase().includes('pool') ||
                           errorMessage.toLowerCase().includes('timeout')
    
    if (isDatabaseError) {
      console.error('[FINANCE_DASHBOARD] Database error detected:', {
        code: error?.code,
        message: errorMessage,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          message: 'Unable to connect to database. Please check your database configuration.',
          code: error?.code,
        },
        { status: 503 }
      )
    }

    // Return fallback stats with arrays to prevent frontend crashes
    return NextResponse.json(
      {
        error: 'Failed to fetch finance dashboard stats',
        message: error?.message,
        totalInvoices: 0,
        invoicesThisMonth: 0,
        invoicesLastMonth: 0,
        invoiceGrowth: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
        pendingInvoices: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        revenueGrowth: 0,
        totalExpenses: 0,
        expensesThisMonth: 0,
        profit: 0,
        profitMargin: 0,
        purchaseOrders: 0,
        purchaseOrdersThisMonth: 0,
        gstReports: 0,
        recentInvoices: [],
        recentPurchaseOrders: [],
        monthlyRevenue: [],
        invoicesByStatus: [],
        arAging: { bucket0_30: 0, bucket31_60: 0, bucket60Plus: 0 },
        apAging: { dueToday: 0, due7d: 0, due30d: 0 },
        vendorsCount: 0,
        vendorsDueAmount: 0,
        gstInputCreditAvailable: 0,
        gstOutputDueThisMonth: 0,
        gstReconciliationPct: 0,
        cashPosition: 0,
        cashRunwayDays: 0,
        bankRecPct: 0,
        creditNotesCount: 0,
        debitNotesCount: 0,
      },
      { status: 500 }
    )
  }
}


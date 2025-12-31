import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/analytics/health-score - Get business health score
export async function GET(request: NextRequest) {
  try {
    // Check Analytics module license
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    // Get business metrics in parallel for better performance
    // Use aggregation queries for accurate, deterministic results
    const [contacts, deals, revenueResult, totalInvoices, paidInvoicesCount, tasks] = await Promise.all([
      prisma.contact.count({ where: { tenantId: tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId: tenantId } }).catch(() => 0),
      // Use aggregation to get total revenue (all orders, not just recent 100)
      prisma.order.aggregate({
        where: { tenantId: tenantId },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: null } })),
      // Get total invoice count (all invoices, not just recent 100)
      prisma.invoice.count({
        where: { tenantId: tenantId },
      }).catch(() => 0),
      // Get paid invoice count
      prisma.invoice.count({
        where: {
          tenantId: tenantId,
          status: 'paid',
        },
      }).catch(() => 0),
      prisma.task.count({
        where: {
          tenantId: tenantId,
          status: { not: 'completed' },
        },
      }).catch(() => 0),
    ])

    // Calculate health score components (0-100 each)
    // Handle Decimal types from Prisma aggregation result
    const totalRevenue = revenueResult._sum.total
      ? (typeof revenueResult._sum.total === 'number' 
          ? revenueResult._sum.total 
          : (typeof revenueResult._sum.total === 'object' && revenueResult._sum.total !== null && 'toNumber' in revenueResult._sum.total)
          ? (revenueResult._sum.total as any).toNumber()
          : parseFloat(String(revenueResult._sum.total || 0)))
      : 0

    const salesScore = Math.min(100, Math.max(0, (deals / 10) * 100)) // Target: 10+ deals
    const revenueScore = Math.min(100, Math.max(0, (totalRevenue / 100000) * 100)) // Target: ₹1L+
    const customerScore = Math.min(100, Math.max(0, (contacts / 50) * 100)) // Target: 50+ contacts
    const collectionScore = totalInvoices > 0 
      ? Math.min(100, Math.max(0, (paidInvoicesCount / totalInvoices) * 100))
      : 0 // Avoid division by zero
    const taskScore = Math.min(100, Math.max(0, 100 - (tasks / 20) * 100)) // Lower is better

    // Weighted average
    const healthScore = Math.round(
      salesScore * 0.25 +
      revenueScore * 0.25 +
      customerScore * 0.20 +
      collectionScore * 0.20 +
      taskScore * 0.10
    )

    return NextResponse.json({
      healthScore: Math.max(0, Math.min(100, healthScore)),
      components: {
        sales: salesScore,
        revenue: revenueScore,
        customers: customerScore,
        collections: collectionScore,
        operations: taskScore,
      },
      metrics: {
        totalContacts: contacts,
        totalDeals: deals,
        totalOrders: 0, // We don't need order count for health score
        totalRevenue: totalRevenue,
        pendingTasks: tasks,
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get health score error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to calculate health score',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/analytics/health-score - Get business health score
export async function GET(request: NextRequest) {
  try {
    // Check Analytics module license
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    // Get business metrics in parallel for better performance
    // Use counts and limited queries instead of fetching all records
    const [contacts, deals, orders, invoices, tasks, paidInvoicesCount] = await Promise.all([
      prisma.contact.count({ where: { tenantId: tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId: tenantId } }).catch(() => 0),
      // Only fetch orders for revenue calculation (limited)
      prisma.order.findMany({ 
        where: { tenantId: tenantId },
        select: { total: true },
        take: 100, // Limit to recent orders for performance
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      // Only fetch invoices for collection calculation (limited)
      prisma.invoice.findMany({ 
        where: { tenantId: tenantId },
        select: { status: true },
        take: 100, // Limit to recent invoices for performance
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      prisma.task.count({
        where: {
          tenantId: tenantId,
          status: { not: 'completed' },
        },
      }).catch(() => 0),
      prisma.invoice.count({
        where: {
          tenantId: tenantId,
          status: 'paid',
        },
      }).catch(() => 0),
    ])

    // Calculate health score components (0-100 each)
    // Handle Decimal types from Prisma
    const totalRevenue = orders.reduce((sum, o) => {
      const orderTotal = o.total
      // Handle Decimal type from Prisma
      const numTotal = typeof orderTotal === 'number' 
        ? orderTotal 
        : (typeof orderTotal === 'object' && orderTotal !== null && 'toNumber' in orderTotal)
        ? (orderTotal as any).toNumber()
        : parseFloat(String(orderTotal || 0))
      return sum + numTotal
    }, 0)
    const totalInvoices = invoices.length

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
        totalOrders: orders.length,
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


import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/analytics/advanced/customers - Get customer analytics (LTV, churn, etc.)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), 0, 1) // Start of year
    const defaultEnd = now

    const start = startDate ? new Date(startDate) : defaultStart
    const end = endDate ? new Date(endDate) : defaultEnd

    // Get all customers with their orders/invoices
    const customers = await prisma.contact.findMany({
      where: {
        tenantId,
        type: { in: ['CUSTOMER', 'CLIENT'] },
      },
      include: {
        orders: {
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: {
            total: true,
            createdAt: true,
            status: true,
          },
        },
        invoices: {
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: {
            total: true,
            createdAt: true,
            status: true,
          },
        },
      },
    })

    // Calculate metrics for each customer
    const customerMetrics = customers.map((customer) => {
      const orders = customer.orders || []
      const invoices = customer.invoices || []
      const allTransactions = [
        ...orders.map((o) => ({ amount: Number(o.total || 0), date: o.createdAt })),
        ...invoices.map((i) => ({ amount: Number(i.total || 0), date: i.createdAt })),
      ]

      const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0)
      const orderCount = orders.length + invoices.length
      const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

      // Calculate last purchase date
      const lastPurchase = allTransactions.length > 0
        ? new Date(Math.max(...allTransactions.map((t) => t.date.getTime())))
        : null

      // Calculate days since last purchase
      const daysSinceLastPurchase = lastPurchase
        ? Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Estimate LTV (Lifetime Value) - simple calculation
      // LTV = Average Order Value × Purchase Frequency × Customer Lifespan
      const purchaseFrequency = orderCount / Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))) // per month
      const estimatedLifespan = 12 // months (assumption)
      const ltv = avgOrderValue * purchaseFrequency * estimatedLifespan

      return {
        customerId: customer.id,
        customerName: customer.name,
        email: customer.email,
        totalRevenue,
        orderCount,
        avgOrderValue,
        lastPurchase,
        daysSinceLastPurchase,
        purchaseFrequency,
        ltv,
        isActive: daysSinceLastPurchase !== null && daysSinceLastPurchase <= 90, // Active if purchased in last 90 days
      }
    })

    // Calculate aggregate metrics
    const totalCustomers = customers.length
    const activeCustomers = customerMetrics.filter((c) => c.isActive).length
    const churnedCustomers = customerMetrics.filter((c) => c.daysSinceLastPurchase !== null && c.daysSinceLastPurchase > 90).length
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0

    const totalLTV = customerMetrics.reduce((sum, c) => sum + c.ltv, 0)
    const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0

    const totalRevenue = customerMetrics.reduce((sum, c) => sum + c.totalRevenue, 0)
    const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

    // Top customers by LTV
    const topCustomersByLTV = customerMetrics
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 10)
      .map((c) => ({
        name: c.customerName,
        ltv: c.ltv,
        totalRevenue: c.totalRevenue,
        orderCount: c.orderCount,
      }))

    // Customer segmentation
    const segments = {
      vip: customerMetrics.filter((c) => c.ltv >= avgLTV * 2).length,
      regular: customerMetrics.filter((c) => c.ltv >= avgLTV && c.ltv < avgLTV * 2).length,
      occasional: customerMetrics.filter((c) => c.ltv < avgLTV && c.ltv > 0).length,
      inactive: customerMetrics.filter((c) => c.ltv === 0 || !c.isActive).length,
    }

    return NextResponse.json({
      summary: {
        totalCustomers,
        activeCustomers,
        churnedCustomers,
        churnRate,
        avgLTV,
        avgRevenuePerCustomer,
      },
      segments,
      topCustomersByLTV,
      dateRange: { start, end },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get customer analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get customer analytics' },
      { status: 500 }
    )
  }
}


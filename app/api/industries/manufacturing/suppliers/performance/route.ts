import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/industries/manufacturing/suppliers/performance - Get supplier performance metrics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'manufacturing') {
      return NextResponse.json(
        { error: 'This endpoint is only for manufacturing industry' },
        { status: 403 }
      )
    }

    const supplierId = request.nextUrl.searchParams.get('supplierId')

    if (supplierId) {
      // Get performance for specific supplier
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          tenantId,
        },
        include: {
          purchaseOrders: {
            where: {
              status: { in: ['CONFIRMED', 'RECEIVED'] },
            },
            include: {
              items: true,
            },
          },
          materials: {
            include: {
              order: true,
            },
          },
        },
      })

      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        )
      }

      // Calculate performance metrics
      const totalOrders = supplier.purchaseOrders.length
      const totalValue = supplier.purchaseOrders.reduce(
        (sum, po) => sum + Number(po.total || 0),
        0
      )

      // Calculate on-time delivery rate
      const onTimeOrders = supplier.purchaseOrders.filter((po) => {
        if (!po.expectedDeliveryDate || !po.actualDeliveryDate) return false
        return po.actualDeliveryDate <= po.expectedDeliveryDate
      }).length

      const onTimeDeliveryRate =
        totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0

      // Calculate average lead time
      const ordersWithLeadTime = supplier.purchaseOrders.filter(
        (po) => po.orderDate && po.actualDeliveryDate
      )
      const avgLeadTime =
        ordersWithLeadTime.length > 0
          ? ordersWithLeadTime.reduce((sum, po) => {
              const leadTime =
                (po.actualDeliveryDate!.getTime() - po.orderDate!.getTime()) /
                (1000 * 60 * 60 * 24) // days
              return sum + leadTime
            }, 0) / ordersWithLeadTime.length
          : 0

      return NextResponse.json({
        supplier: {
          id: supplier.id,
          name: supplier.name,
          code: supplier.code,
        },
        metrics: {
          totalOrders,
          totalValue: Math.round(totalValue),
          onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
          averageLeadTime: Math.round(avgLeadTime * 100) / 100,
          rating: supplier.rating ? Number(supplier.rating) : null,
          qualityScore: supplier.qualityScore ? Number(supplier.qualityScore) : null,
        },
        recentOrders: supplier.purchaseOrders
          .slice(0, 10)
          .map((po) => ({
            id: po.id,
            orderNumber: po.orderNumber,
            orderDate: po.orderDate,
            total: Number(po.total || 0),
            status: po.status,
          })),
      })
    } else {
      // Get performance for all suppliers
      const suppliers = await prisma.supplier.findMany({
        where: { tenantId },
        include: {
          purchaseOrders: {
            where: {
              status: { in: ['CONFIRMED', 'RECEIVED'] },
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      const performance = suppliers.map((supplier) => {
        const totalOrders = supplier.purchaseOrders.length
        const onTimeOrders = supplier.purchaseOrders.filter((po) => {
          if (!po.expectedDeliveryDate || !po.actualDeliveryDate) return false
          return po.actualDeliveryDate <= po.expectedDeliveryDate
        }).length

        return {
          supplierId: supplier.id,
          supplierName: supplier.name,
          supplierCode: supplier.code,
          totalOrders,
          onTimeDeliveryRate:
            totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100 * 100) / 100 : 0,
          rating: supplier.rating ? Number(supplier.rating) : null,
          qualityScore: supplier.qualityScore ? Number(supplier.qualityScore) : null,
          status: supplier.status,
        }
      })

      return NextResponse.json({ performance })
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get supplier performance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier performance' },
      { status: 500 }
    )
  }
}


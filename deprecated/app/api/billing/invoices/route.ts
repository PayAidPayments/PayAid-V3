import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/billing/invoices - List subscription invoices
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId,
    }

    if (status) {
      where.status = status
    }

    const [invoices, total] = await Promise.all([
      prisma.subscriptionInvoice.findMany({
        where,
        include: {
          subscription: {
            select: {
              id: true,
              tier: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          paymentMethod: {
            select: {
              id: true,
              type: true,
              last4: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriptionInvoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}


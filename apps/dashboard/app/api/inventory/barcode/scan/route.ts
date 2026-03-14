import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// POST /api/inventory/barcode/scan - Scan barcode and get product
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const { barcode, locationId } = body

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Search for product by barcode
    const product = await prisma.product.findFirst({
      where: {
        tenantId,
        barcode: barcode,
      },
      include: {
        inventoryLocations: locationId
          ? {
              where: { locationId },
            }
          : true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', barcode },
        { status: 404 }
      )
    }

    // Get location-specific quantity if locationId provided
    let locationQuantity = null
    if (locationId) {
      const invLocation = await prisma.inventoryLocation.findFirst({
        where: {
          tenantId,
          productId: product.id,
          locationId,
        },
      })
      locationQuantity = invLocation?.quantity || 0
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity: locationQuantity !== null ? locationQuantity : product.quantity,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        reorderLevel: product.reorderLevel,
        locationId: locationId || null,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Barcode scan error:', error)
    return NextResponse.json(
      { error: 'Failed to scan barcode' },
      { status: 500 }
    )
  }
}

// GET /api/inventory/barcode/scan?barcode=xxx - Get product by barcode (for GET requests)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')
    const locationId = searchParams.get('locationId') || undefined

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode parameter is required' },
        { status: 400 }
      )
    }

    // Search for product by barcode
    const product = await prisma.product.findFirst({
      where: {
        tenantId,
        barcode: barcode,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', barcode },
        { status: 404 }
      )
    }

    // Get location-specific quantity if locationId provided
    let locationQuantity = null
    if (locationId) {
      const invLocation = await prisma.inventoryLocation.findFirst({
        where: {
          tenantId,
          productId: product.id,
          locationId,
        },
      })
      locationQuantity = invLocation?.quantity || 0
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity: locationQuantity !== null ? locationQuantity : product.quantity,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        reorderLevel: product.reorderLevel,
        locationId: locationId || null,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Barcode scan error:', error)
    return NextResponse.json(
      { error: 'Failed to scan barcode' },
      { status: 500 }
    )
  }
}


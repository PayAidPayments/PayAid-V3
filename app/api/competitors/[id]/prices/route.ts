import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/competitors/[id]/prices - Get competitor prices
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const prices = await prisma.competitorPrice.findMany({
      where: { competitorId: params.id },
      orderBy: { lastCheckedAt: 'desc' },
    })

    return NextResponse.json({ prices })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get competitor prices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

// POST /api/competitors/[id]/prices - Add/Update competitor price
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { productName, productSku, price, currency, source, url } = body

    if (!productName || price === undefined) {
      return NextResponse.json(
        { error: 'Product name and price are required' },
        { status: 400 }
      )
    }

    // Check if price exists for this product
    const existingPrice = await prisma.competitorPrice.findFirst({
      where: {
        competitorId: params.id,
        productSku: productSku || null,
        productName,
      },
      orderBy: { lastCheckedAt: 'desc' },
    })

    let priceRecord
    const oldPrice = existingPrice ? Number(existingPrice.price) : null
    const newPrice = Number(price)

    if (existingPrice) {
      // Update existing price
      priceRecord = await prisma.competitorPrice.update({
        where: { id: existingPrice.id },
        data: {
          price: newPrice,
          currency: currency || 'INR',
          source,
          url,
          lastCheckedAt: new Date(),
        },
      })

      // Create alert if price changed significantly (>5%)
      if (oldPrice && Math.abs((newPrice - oldPrice) / oldPrice) > 0.05) {
        const priceChange = newPrice - oldPrice
        const percentChange = ((priceChange / oldPrice) * 100).toFixed(2)

        await prisma.competitorAlert.create({
          data: {
            competitorId: params.id,
            type: priceChange > 0 ? 'PRICE_INCREASE' : 'PRICE_DROP',
            title: `Price ${priceChange > 0 ? 'Increased' : 'Dropped'} for ${productName}`,
            message: `Price changed from ₹${oldPrice.toFixed(2)} to ₹${newPrice.toFixed(2)} (${percentChange}%)`,
            severity: Math.abs(priceChange / oldPrice) > 0.1 ? 'WARNING' : 'INFO',
            metadata: {
              productName,
              productSku,
              oldPrice,
              newPrice,
              percentChange: parseFloat(percentChange),
            },
          },
        })
      }
    } else {
      // Create new price record
      priceRecord = await prisma.competitorPrice.create({
        data: {
          competitorId: params.id,
          productName,
          productSku,
          price: newPrice,
          currency: currency || 'INR',
          source: source || 'manual',
          url,
          lastCheckedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ price: priceRecord }, { status: existingPrice ? 200 : 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Add competitor price error:', error)
    return NextResponse.json(
      { error: 'Failed to add price' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { syncInventoryToChannel, getChannelPerformance } from '@/lib/ecommerce/channels'

// GET /api/ecommerce/channels - Get channels and performance
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')

    if (startDate && endDate) {
      const performance = await getChannelPerformance(
        tenantId,
        new Date(startDate),
        new Date(endDate)
      )

      return NextResponse.json({
        success: true,
        performance,
      })
    }

    // Return channel list
    return NextResponse.json({
      success: true,
      channels: [],
    })
  } catch (error: any) {
    console.error('Channels error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get channels' },
      { status: 500 }
    )
  }
}

// POST /api/ecommerce/channels/sync - Sync inventory to channel
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { channelId, productIds } = body

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId is required' },
        { status: 400 }
      )
    }

    const result = await syncInventoryToChannel(tenantId, channelId, productIds)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Channel sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync channel' },
      { status: 500 }
    )
  }
}


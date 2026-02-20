import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/marketplace/apps - List available marketplace apps */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    
    // For now, return hardcoded apps list
    // In future, fetch from MarketplaceApp model
    const apps = [
      {
        id: 'webhook-connector',
        name: 'Webhook Connector',
        description: 'Receive real-time events from PayAid via HTTP callbacks',
        category: 'Integration',
        icon: '🔗',
        rating: 4.8,
        reviews: 124,
        installed: false,
      },
      {
        id: 'tally-sync',
        name: 'Tally Sync',
        description: 'Two-way sync between PayAid and Tally accounting',
        category: 'Accounting',
        icon: '📊',
        rating: 4.5,
        reviews: 89,
        installed: false,
      },
      {
        id: 'razorpay-connector',
        name: 'Razorpay Payment Gateway',
        description: 'Accept payments and generate payment links',
        category: 'Payments',
        icon: '💳',
        rating: 4.7,
        reviews: 156,
        installed: false,
      },
    ]

    return NextResponse.json({ apps })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list apps' },
      { status: 500 }
    )
  }
}

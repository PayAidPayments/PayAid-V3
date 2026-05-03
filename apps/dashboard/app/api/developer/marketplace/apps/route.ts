import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/developer/marketplace/apps
 * Get all marketplace apps (third-party integrations)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'api-integration-hub')

    // Get marketplace apps
    // Note: Create MarketplaceApp model in schema if needed
    // For now, return predefined apps
    const apps = [
      {
        id: 'zapier',
        name: 'Zapier',
        description: 'Connect PayAid with 5000+ apps via Zapier',
        category: 'automation',
        icon: '⚡',
        isInstalled: false,
        rating: 4.8,
        installs: 10000,
        developer: 'Zapier Inc.',
        pricing: 'Free',
      },
      {
        id: 'make',
        name: 'Make (Integromat)',
        description: 'Automate workflows with visual builder',
        category: 'automation',
        icon: '🔧',
        isInstalled: false,
        rating: 4.7,
        installs: 5000,
        developer: 'Make.com',
        pricing: 'Free',
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Get PayAid notifications in Slack',
        category: 'communication',
        icon: '💬',
        isInstalled: false,
        rating: 4.6,
        installs: 8000,
        developer: 'Slack Technologies',
        pricing: 'Free',
      },
      {
        id: 'google-sheets',
        name: 'Google Sheets',
        description: 'Sync data with Google Sheets',
        category: 'productivity',
        icon: '📊',
        isInstalled: false,
        rating: 4.5,
        installs: 12000,
        developer: 'Google',
        pricing: 'Free',
      },
      {
        id: 'shopify',
        name: 'Shopify',
        description: 'Sync orders and products with Shopify',
        category: 'ecommerce',
        icon: '🛒',
        isInstalled: false,
        rating: 4.9,
        installs: 3000,
        developer: 'Shopify',
        pricing: 'Paid',
      },
    ]

    return NextResponse.json({ apps })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get marketplace apps error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplace apps' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/developer/marketplace/apps/[id]/install
 * Install a marketplace app
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'api-integration-hub')

    const body = await request.json()
    const { appId } = body

    if (!appId) {
      return NextResponse.json(
        { error: 'App ID is required' },
        { status: 400 }
      )
    }

    // Install app (create integration record)
    // Note: Create MarketplaceAppInstallation model in schema
    const installation = {
      id: `install_${Date.now()}`,
      tenantId,
      appId,
      installedAt: new Date(),
      status: 'active',
    }

    return NextResponse.json({ installation }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Install app error:', error)
    return NextResponse.json(
      { error: 'Failed to install app' },
      { status: 500 }
    )
  }
}


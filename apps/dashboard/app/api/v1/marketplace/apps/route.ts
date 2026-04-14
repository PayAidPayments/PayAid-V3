import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { marketplaceInstallBodySchema, type MarketplaceApp } from '@/lib/ai-native/m2-contracts'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

// Catalog of available marketplace apps (sourced from DB when MarketplaceApp model exists)
const CATALOG: MarketplaceApp[] = [
  { id: 'webhook-connector', name: 'Webhook Connector', description: 'Receive real-time events from PayAid via HTTP callbacks', category: 'Integration', icon: '🔗', rating: 4.8, reviews: 124, installed: false, status: 'available', permissions: ['webhook:read', 'webhook:write'], event_subscriptions: ['*'], plan: 'free', schema_version: '1.0' },
  { id: 'tally-sync', name: 'Tally Sync', description: 'Two-way sync between PayAid and Tally accounting', category: 'Accounting', icon: '📊', rating: 4.5, reviews: 89, installed: false, status: 'available', permissions: ['finance:read', 'finance:write'], event_subscriptions: ['invoice.created', 'invoice.updated'], plan: 'starter', schema_version: '1.0' },
  { id: 'razorpay-connector', name: 'Razorpay Payment Gateway', description: 'Accept payments and generate payment links via Razorpay', category: 'Payments', icon: '💳', rating: 4.7, reviews: 156, installed: false, status: 'available', permissions: ['payments:read', 'payments:write'], event_subscriptions: ['payment.captured', 'payment.failed'], plan: 'starter', schema_version: '1.0' },
  { id: 'whatsapp-business', name: 'WhatsApp Business', description: 'Send and receive WhatsApp messages from within PayAid', category: 'Communication', icon: '💬', rating: 4.9, reviews: 312, installed: false, status: 'available', permissions: ['messaging:send', 'contacts:read'], event_subscriptions: ['message.received', 'message.delivered'], plan: 'pro', schema_version: '1.0' },
  { id: 'google-workspace', name: 'Google Workspace', description: 'Sync contacts, calendar events, and emails with Google', category: 'Productivity', icon: '🔵', rating: 4.6, reviews: 201, installed: false, status: 'available', permissions: ['contacts:read', 'contacts:write', 'calendar:read'], event_subscriptions: ['contact.created', 'event.created'], plan: 'free', schema_version: '1.0' },
  { id: 'shiprocket', name: 'Shiprocket', description: 'Automate shipping and logistics for ecommerce orders', category: 'Logistics', icon: '🚚', rating: 4.4, reviews: 77, installed: false, status: 'available', permissions: ['orders:read', 'shipments:write'], event_subscriptions: ['order.created', 'shipment.delivered'], plan: 'starter', schema_version: '1.0' },
  { id: 'zoho-books-sync', name: 'Zoho Books Sync', description: 'Export invoices and contacts to Zoho Books', category: 'Accounting', icon: '📒', rating: 4.3, reviews: 54, installed: false, status: 'available', permissions: ['finance:read'], event_subscriptions: ['invoice.created'], plan: 'pro', schema_version: '1.0' },
  { id: 'slack-notifications', name: 'Slack Notifications', description: 'Push deal, lead, and alert notifications to Slack channels', category: 'Collaboration', icon: '🔔', rating: 4.8, reviews: 187, installed: false, status: 'available', permissions: ['notifications:write'], event_subscriptions: ['deal.stage_changed', 'lead.assigned', 'alert.triggered'], plan: 'free', schema_version: '1.0' },
]

/**
 * GET /api/v1/marketplace/apps
 * List available marketplace apps with install status for the tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_marketplace')

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const plan = searchParams.get('plan')

    // Fetch installed apps for this tenant from AuditLog (used as install registry)
    const installedRecords = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: {
          in: ['marketplace_app_install', 'marketplace_app'],
        },
        changeSummary: {
          in: ['install', 'installed', 'marketplace_installed'],
        },
      },
      select: { entityId: true, afterSnapshot: true },
    })

    const installedIds = new Set(installedRecords.map((r) => r.entityId))

    let apps = CATALOG.map((app) => ({
      ...app,
      installed: installedIds.has(app.id),
      status: installedIds.has(app.id) ? ('installed' as const) : ('available' as const),
    }))

    if (category) apps = apps.filter((a) => a.category.toLowerCase() === category.toLowerCase())
    if (plan) apps = apps.filter((a) => a.plan === plan)

    return NextResponse.json({
      apps,
      total: apps.length,
      installed_count: installedIds.size,
    })
  } catch (error) {
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const errResponse = handleLicenseError(error)
    if (errResponse) return errResponse
    console.error('Marketplace apps list error:', error)
    return NextResponse.json({ error: 'Failed to list marketplace apps' }, { status: 500 })
  }
}

/**
 * POST /api/v1/marketplace/apps
 * Install a marketplace app for the tenant.
 * Body: { app_id, config? }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_marketplace')

    const body = await request.json()
    const validated = marketplaceInstallBodySchema.parse(body)

    const app = CATALOG.find((a) => a.id === validated.app_id)
    if (!app) {
      return NextResponse.json({ error: 'App not found', app_id: validated.app_id }, { status: 404 })
    }

    // Check already installed
    const existing = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        entityId: validated.app_id,
        entityType: {
          in: ['marketplace_app_install', 'marketplace_app'],
        },
        changeSummary: {
          in: ['install', 'installed', 'marketplace_installed'],
        },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'App is already installed', app_id: validated.app_id, code: 'ALREADY_INSTALLED' },
        { status: 400 }
      )
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        changedBy: userId || 'system',
        entityType: 'marketplace_app',
        entityId: validated.app_id,
        changeSummary: 'marketplace_installed',
        afterSnapshot: {
          app_id: validated.app_id,
          name: app.name,
          plan: app.plan,
          permissions: app.permissions,
          config: validated.config ?? {},
          installed_at: new Date().toISOString(),
          schema_version: '1.0',
           
        },
      },
    })

    trackEvent('marketplace_app_installed', {
      tenantId,
      userId,
      entityId: validated.app_id,
      properties: { app_name: app.name, category: app.category, plan: app.plan },
    })

    return NextResponse.json(
      {
        success: true,
        installation: {
          app_id: validated.app_id,
          name: app.name,
          status: 'installed',
          plan: app.plan,
          permissions: app.permissions,
          installed_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const errResponse = handleLicenseError(error)
    if (errResponse) return errResponse
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Marketplace app install error:', error)
    return NextResponse.json({ error: 'Failed to install app' }, { status: 500 })
  }
}

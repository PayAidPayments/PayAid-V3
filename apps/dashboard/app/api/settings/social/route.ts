import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import {
  normalizeSocialProviderAlias,
  SOCIAL_SETTINGS_PROVIDER_IDS,
  SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES,
} from '@/lib/integrations/social-provider-aliases'

function deriveHealth(row: {
  isActive: boolean
  expiresAt: Date | null
  provider: string
  scope?: string | null
}): 'not_connected' | 'healthy' | 'expiring_soon' | 'expired' | 'missing_scope' {
  if (!row.isActive) return 'not_connected'
  const now = Date.now()
  if (row.expiresAt && row.expiresAt.getTime() <= now) return 'expired'
  if (row.expiresAt && row.expiresAt.getTime() - now <= 24 * 60 * 60 * 1000) return 'expiring_soon'
  if (row.provider === 'youtube' || row.provider === 'google') {
    const scope = String(row.scope || '').toLowerCase()
    if (scope && !scope.includes('youtube.upload') && !scope.includes('youtube.force-ssl')) {
      return 'missing_scope'
    }
  }
  return 'healthy'
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const [oauth, accounts] = await Promise.all([
      prisma.oAuthIntegration.findMany({
        where: { tenantId: user.tenantId, provider: { in: SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES as unknown as string[] } },
        select: {
          provider: true,
          isActive: true,
          providerName: true,
          providerEmail: true,
          providerAvatarUrl: true,
          lastUsedAt: true,
          expiresAt: true,
          scope: true,
          updatedAt: true,
        },
      }),
      prisma.socialMediaAccount.findMany({
        where: { tenantId: user.tenantId },
        select: {
          platform: true,
          accountName: true,
          isConnected: true,
          lastSyncAt: true,
          updatedAt: true,
        },
      }),
    ])

    const byProvider = new Map<string, any>()
    for (const p of SOCIAL_SETTINGS_PROVIDER_IDS) {
      byProvider.set(p, {
        provider: p,
        connected: false,
        viaOAuth: false,
        viaSocialAccount: false,
        providerName: null,
        providerEmail: null,
        providerAvatarUrl: null,
        expiresAt: null,
        lastActivityAt: null,
        health: 'not_connected',
      })
    }

    for (const row of oauth) {
      const providerKey = normalizeSocialProviderAlias(row.provider)
      const item = byProvider.get(providerKey) || { provider: providerKey }
      item.connected = Boolean(row.isActive)
      item.viaOAuth = true
      item.providerName = row.providerName || null
      item.providerEmail = row.providerEmail || null
      item.providerAvatarUrl = row.providerAvatarUrl || null
      item.expiresAt = row.expiresAt?.toISOString?.() ?? null
      item.lastActivityAt = (row.lastUsedAt || row.updatedAt)?.toISOString?.() ?? null
      item.health = deriveHealth({
        isActive: Boolean(row.isActive),
        expiresAt: row.expiresAt || null,
        provider: providerKey,
        scope: row.scope || null,
      })
      byProvider.set(providerKey, item)
    }

    for (const row of accounts) {
      const key = String(row.platform || '').toLowerCase()
      if (!byProvider.has(key)) continue
      const item = byProvider.get(key)
      item.connected = item.connected || Boolean(row.isConnected)
      item.viaSocialAccount = true
      if (!item.providerName && row.accountName) item.providerName = row.accountName
      if (!item.lastActivityAt) item.lastActivityAt = (row.lastSyncAt || row.updatedAt)?.toISOString?.() ?? null
      byProvider.set(key, item)
    }

    return NextResponse.json({
      providers: Array.from(byProvider.values()),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Get social settings error:', error)
    return NextResponse.json({ error: 'Failed to get social settings' }, { status: 500 })
  }
}


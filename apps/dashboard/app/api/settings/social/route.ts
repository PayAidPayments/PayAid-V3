import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const [oauth, accounts] = await Promise.all([
      prisma.oAuthIntegration.findMany({
        where: { tenantId: user.tenantId, provider: { in: ['linkedin', 'facebook', 'instagram', 'twitter'] } },
        select: {
          provider: true,
          isActive: true,
          providerName: true,
          providerEmail: true,
          lastUsedAt: true,
          expiresAt: true,
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
    for (const p of ['linkedin', 'facebook', 'instagram', 'twitter']) {
      byProvider.set(p, {
        provider: p,
        connected: false,
        viaOAuth: false,
        viaSocialAccount: false,
        providerName: null,
        providerEmail: null,
        expiresAt: null,
        lastActivityAt: null,
      })
    }

    for (const row of oauth) {
      const item = byProvider.get(row.provider) || { provider: row.provider }
      item.connected = Boolean(row.isActive)
      item.viaOAuth = true
      item.providerName = row.providerName || null
      item.providerEmail = row.providerEmail || null
      item.expiresAt = row.expiresAt?.toISOString?.() ?? null
      item.lastActivityAt = (row.lastUsedAt || row.updatedAt)?.toISOString?.() ?? null
      byProvider.set(row.provider, item)
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


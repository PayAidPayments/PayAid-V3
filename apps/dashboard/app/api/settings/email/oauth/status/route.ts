import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'

type Provider = 'gmail' | 'outlook'

function toProviderStatus(provider: Provider, account: any | null) {
  const creds = (account?.providerCredentials || {}) as Record<string, any>
  const expiresAtRaw = creds?.expiresAt || null
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null
  const now = new Date()
  const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : false
  const minutesToExpiry = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 60000) : null

  let health: 'not_connected' | 'healthy' | 'expiring_soon' | 'expired' = 'not_connected'
  if (account?.isActive) {
    if (isExpired) health = 'expired'
    else if (minutesToExpiry !== null && minutesToExpiry <= 60 * 24) health = 'expiring_soon'
    else health = 'healthy'
  }

  return {
    provider,
    connected: Boolean(account?.isActive),
    email: account?.email || null,
    displayName: account?.displayName || null,
    lastSyncAt: account?.lastSyncAt?.toISOString?.() ?? null,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    scope: creds?.scope || null,
    health,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const [gmail, outlook] = await Promise.all([
      prisma.emailAccount.findFirst({
        where: { tenantId: user.tenantId, provider: 'gmail', isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.emailAccount.findFirst({
        where: { tenantId: user.tenantId, provider: 'outlook', isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      providers: [toProviderStatus('gmail', gmail), toProviderStatus('outlook', outlook)],
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Email OAuth status error:', error)
    return NextResponse.json({ error: 'Failed to get email OAuth status' }, { status: 500 })
  }
}


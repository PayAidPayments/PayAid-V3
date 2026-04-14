import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { decrypt } from '@/lib/encryption'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { captureIntegrationError, enforceIntegrationRateLimit } from '@/lib/integrations/security'

const querySchema = z.object({
  provider: z.enum(['linkedin', 'facebook', 'instagram', 'twitter']),
})

async function testLinkedIn(token: string) {
  const res = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store' as any,
  })
  if (!res.ok) throw new Error(`LinkedIn API check failed (HTTP ${res.status})`)
}

async function testMeta(token: string, provider: 'facebook' | 'instagram') {
  const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`, {
    cache: 'no-store' as any,
  })
  if (!res.ok) {
    throw new Error(`${provider} API check failed (HTTP ${res.status})`)
  }
}

async function testTwitter(token: string) {
  const res = await fetch('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store' as any,
  })
  if (!res.ok) throw new Error(`Twitter/X API check failed (HTTP ${res.status})`)
}

export async function POST(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:social:test',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  let actor: { tenantId: string; userId: string | null | undefined } | null = null

  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    actor = { tenantId: user.tenantId, userId: user.userId }
    await assertIntegrationPermission(request, 'configure')

    const { searchParams } = new URL(request.url)
    const { provider } = querySchema.parse({ provider: searchParams.get('provider') || '' })

    const integration = await prisma.oAuthIntegration.findFirst({
      where: { tenantId: user.tenantId, provider, isActive: true },
    })
    if (!integration?.accessToken) {
      return NextResponse.json({ error: `${provider} is not connected` }, { status: 400 })
    }

    const token = decrypt(integration.accessToken)

    if (provider === 'linkedin') await testLinkedIn(token)
    if (provider === 'facebook' || provider === 'instagram') await testMeta(token, provider)
    if (provider === 'twitter') await testTwitter(token)

    await prisma.oAuthIntegration.update({
      where: { id: integration.id },
      data: { lastUsedAt: new Date() },
    })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_social',
      entityId: `${user.tenantId}:${provider}`,
      action: 'social_connection_test_passed',
      after: { provider, ok: true },
    })

    return NextResponse.json({ ok: true, provider })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    await captureIntegrationError({
      scope: 'social_connection_test',
      tenantId: actor?.tenantId,
      userId: actor?.userId,
      error,
    })
    return NextResponse.json(
      { error: 'Failed to test social connection' },
      { status: 502 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import {
  getSocialProviderAliases,
  normalizeSocialProviderAlias,
  SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES,
} from '@/lib/integrations/social-provider-aliases'

const bodySchema = z.object({
  provider: z.enum(SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES),
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const { provider } = bodySchema.parse(await request.json())
    const providerAliases = getSocialProviderAliases(provider)
    const platformKey = normalizeSocialProviderAlias(provider)
    await Promise.all([
      prisma.oAuthIntegration.updateMany({
        where: { tenantId: user.tenantId, provider: { in: providerAliases } },
        data: { isActive: false, accessToken: '', refreshToken: null, expiresAt: null, lastUsedAt: new Date() },
      }),
      prisma.socialMediaAccount.updateMany({
        where: { tenantId: user.tenantId, platform: { equals: platformKey, mode: 'insensitive' } },
        data: { isConnected: false },
      }),
    ])

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_social',
      entityId: `${user.tenantId}:${platformKey}`,
      action: 'social_provider_disconnected',
      after: { provider: platformKey, isActive: false },
    })

    return NextResponse.json({ ok: true, provider: platformKey })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Disconnect social provider error:', error)
    return NextResponse.json({ error: 'Failed to disconnect provider' }, { status: 500 })
  }
}


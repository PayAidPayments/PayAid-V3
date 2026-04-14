import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'

const bodySchema = z.object({
  provider: z.enum(['linkedin', 'facebook', 'instagram', 'twitter']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const { provider } = bodySchema.parse(await request.json())

    await Promise.all([
      prisma.oAuthIntegration.updateMany({
        where: { tenantId: user.tenantId, provider },
        data: { isActive: false, accessToken: '', refreshToken: null, expiresAt: null, lastUsedAt: new Date() },
      }),
      prisma.socialMediaAccount.updateMany({
        where: { tenantId: user.tenantId, platform: { equals: provider, mode: 'insensitive' } },
        data: { isConnected: false },
      }),
    ])

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_social',
      entityId: `${user.tenantId}:${provider}`,
      action: 'social_provider_disconnected',
      after: { provider, isActive: false },
    })

    return NextResponse.json({ ok: true, provider })
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


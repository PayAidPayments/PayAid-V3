import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'

const bodySchema = z.object({
  provider: z.enum(['linkedin', 'facebook', 'instagram', 'twitter']),
  accessToken: z.string().min(10),
  refreshToken: z.string().min(10).optional(),
  expiresInSeconds: z.number().int().positive().max(60 * 60 * 24 * 365).optional(),
  providerUserId: z.string().optional(),
  providerEmail: z.string().email().optional(),
  providerName: z.string().optional(),
  scope: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const body = bodySchema.parse(await request.json())
    const expiresAt = body.expiresInSeconds ? new Date(Date.now() + body.expiresInSeconds * 1000) : null

    const saved = await prisma.oAuthIntegration.upsert({
      where: { tenantId_provider: { tenantId: user.tenantId, provider: body.provider } },
      create: {
        tenantId: user.tenantId,
        provider: body.provider,
        accessToken: encrypt(body.accessToken),
        refreshToken: body.refreshToken ? encrypt(body.refreshToken) : null,
        expiresAt,
        tokenType: 'Bearer',
        scope: body.scope || null,
        providerUserId: body.providerUserId || null,
        providerEmail: body.providerEmail || null,
        providerName: body.providerName || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        accessToken: encrypt(body.accessToken),
        refreshToken: body.refreshToken ? encrypt(body.refreshToken) : null,
        expiresAt,
        tokenType: 'Bearer',
        scope: body.scope || null,
        providerUserId: body.providerUserId || null,
        providerEmail: body.providerEmail || null,
        providerName: body.providerName || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      select: { provider: true, updatedAt: true, expiresAt: true, providerName: true, providerEmail: true },
    })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_social',
      entityId: `${user.tenantId}:${saved.provider}`,
      action: 'social_provider_connected_manual_token',
      after: {
        provider: saved.provider,
        expiresAt: saved.expiresAt?.toISOString() ?? null,
        providerName: saved.providerName ?? null,
        providerEmail: saved.providerEmail ?? null,
      },
    })

    return NextResponse.json({
      ok: true,
      provider: saved.provider,
      updatedAt: saved.updatedAt?.toISOString?.() ?? null,
      expiresAt: saved.expiresAt?.toISOString?.() ?? null,
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json({ error: 'Server encryption is not configured. Set ENCRYPTION_KEY and redeploy.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to connect social provider' }, { status: 500 })
  }
}
